import verifyJWT from "./utils/verifyJWT";
import Chat from "./modules/chat/chat.model";
import Message from "./modules/message/message.model";
import messageService from "./modules/message/message.service";
import { Server as HttpServer } from 'http';
import { Server } from "socket.io";
import { withSocketErrorHandler } from "./utils/withSocketErrorHandler";
import { ObjectId } from "mongoose";

// Map to track online users (key: userId, value: Set of socket IDs)
const onlineUsers = new Map<string, Set<string>>();
// Map to track typing status (key: chatId, value: Set of userIds currently typing)
const typingUsers = new Map<string, Set<string>>();

const initializeSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.headers['authorization']?.split('Bearer ')[1] || socket.handshake.auth;

    if (!token) {
      return next(new Error("Authentication error"));
    }
    try {
      const user = verifyJWT(token as string);
      socket.data.user = user;
      next();
    } catch (error: any) {
      next(new Error(error.message || "Authentication error2"));
    }
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    const userId = socket.data.user.id;

    // Add user to onlineUsers map on connection
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Notify all clients of the online status
    io.emit("userStatus", { userId, status: "online" });

    socket.on("joinChat", withSocketErrorHandler(async ({ chatId }: { chatId: string }) => {
      const chat = await Chat.findById(chatId);
      if (!chat) throw new Error("Chat not found");
      if (!chat.participants.includes(socket.data.user.id)) {
        throw new Error("Unauthorized to join this chat");
      }
      socket.join(chatId);
      socket.emit("joinedChat", chatId);
      console.log(`User ${socket.data.user.id} joined chat ${chatId}`);

      // Initialize typing status for this chat if not present
      if (!typingUsers.has(chatId)) {
        typingUsers.set(chatId, new Set());
      }
    }));

    socket.on("sendMessage", withSocketErrorHandler(async ({ chat, text, file }: { chat: ObjectId; text: string; file: any }) => {
      const userId = socket.data.user.id;

      const messagePayload = {
        chat,
        text,
        file,
        sender: userId,
      };

      const message = await messageService.createMessage(messagePayload);
      io.to(chat.toString()).emit("newMessage", message);

      // Stop typing status when a message is sent
      if (typingUsers.has(chat.toString())) {
        const typingSet = typingUsers.get(chat.toString())!;
        typingSet.delete(userId);
        io.to(chat.toString()).emit("typingStatus", { chatId: chat.toString(), userId, status: "stopped" });
      }
    }));

    socket.on("markSeen", withSocketErrorHandler(async ({ messageId, chatId }: { messageId: string; chatId: string }) => {
      const userId = socket.data.user.id;
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.includes(userId)) {
        throw new Error("Unauthorized or invalid chat");
      }

      const message = await Message.findByIdAndUpdate(messageId, { isSeen: true }, { new: true });
      if (message) {
        io.to(chatId).emit("messageUpdated", {
          _id: message._id,
          isSeen: true,
        });
      }
    }));

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      const userId = socket.data.user.id;

      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit("userStatus", { userId, status: "offline" });
        }
      }

      // Clear typing status for all chats the user was in
      typingUsers.forEach((typingSet, chatId) => {
        if (typingSet.has(userId)) {
          typingSet.delete(userId);
          io.to(chatId).emit("typingStatus", { chatId, userId, status: "stopped" });
        }
      });
    });

    // Event to check the online status of a specific user
    socket.on("checkUserStatus", ({ userId }: { userId: string }) => {
      const isOnline = onlineUsers.has(userId);
      socket.emit("userStatusResponse", { userId, status: isOnline ? "online" : "offline" });
    });

    // Event to handle typing status
    socket.on("typing", ({ chatId }: { chatId: string }) => {
      const userId = socket.data.user.id;
      if (typingUsers.has(chatId)) {
        const typingSet = typingUsers.get(chatId)!;
        if (!typingSet.has(userId)) {
          typingSet.add(userId);
          io.to(chatId).emit("typingStatus", { chatId, userId, status: "typing" });
        }
      }
    });

    socket.on("stopTyping", ({ chatId }: { chatId: string }) => {
      const userId = socket.data.user.id;
      if (typingUsers.has(chatId)) {
        const typingSet = typingUsers.get(chatId)!;
        if (typingSet.has(userId)) {
          typingSet.delete(userId);
          io.to(chatId).emit("typingStatus", { chatId, userId, status: "stopped" });
        }
      }
    });
  });

  return io;
};

export default initializeSocket;