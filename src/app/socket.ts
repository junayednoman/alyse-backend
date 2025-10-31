import verifyJWT from "./utils/verifyJWT";
import Chat from "./modules/chat/chat.model";
import Message from "./modules/message/message.model";
import messageService from "./modules/message/message.service";
import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { withSocketErrorHandler } from "./utils/withSocketErrorHandler";
import { ObjectId } from "mongoose";
import chatService from "./modules/chat/chat.service";
import { AppError } from "./classes/appError";
import Auth from "./modules/auth/auth.model";
import { TTeacher } from "./modules/teacher/teacher.interface";
import { sendNotification } from "./utils/sendNotification";

// Map to track online users (key: userId, value: Set of socket IDs)
const onlineUsers = new Map<string, Set<string>>();
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
    const token =
      socket.handshake.headers["authorization"]?.split("Bearer ")[1] ||
      socket.handshake.auth;

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
    const userId = socket.data.user.id;

    // Add user to onlineUsers map on connection
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    socket.on(
      "joinChat",
      withSocketErrorHandler(async ({ chatId }: { chatId: string }) => {
        const chat = await Chat.findById(chatId);
        if (!chat) throw new Error("Chat not found");
        if (!chat.participants.includes(userId)) {
          throw new Error("Unauthorized to join this chat");
        }

        socket.join(chatId);
        socket.emit("joinedChat", chatId);

        // const partnerId = chat.participants.find((id) => id !== userId);
        const statuses = chat.participants.map((id) => ({
          id,
          status: onlineUsers.has(id.toString()) ? "online" : "offline",
        }));

        if (statuses.length > 0) {
          // const isOnline = onlineUsers.has(partnerId!.toString());
          socket.emit("userStatus", statuses);
        }

        // Initialize typing status for this chat if not present
        if (!typingUsers.has(chatId)) {
          typingUsers.set(chatId, new Set());
        }
      })
    );

    socket.on(
      "sendMessage",
      withSocketErrorHandler(
        async ({
          chat,
          text,
          file,
        }: {
          chat: ObjectId;
          text: string;
          file: any;
        }) => {
          const chatData = await Chat.findById(chat);
          if (!chatData) throw new AppError(400, "Invalid chat ID!");

          const receiver = chatData.participants.find(
            (id) => id != userId
          ) as ObjectId;

          const messagePayload = {
            chat,
            text,
            file,
            sender: userId,
            receiver,
          };

          const message = await messageService.createMessage(messagePayload);

          io.to(chat.toString()).emit("newMessage", message);

          const chats = await chatService.getMyChats(userId);
          io.to(chat.toString()).emit("updatedChats", chats);

          // Stop typing status when a message is sent
          if (typingUsers.has(chat.toString())) {
            const typingSet = typingUsers.get(chat.toString())!;
            typingSet.delete(userId);
            io.to(chat.toString()).emit("typingStatus", {
              chatId: chat.toString(),
              userId,
              status: "stopped",
            });
          }

          // send updated user status
          const statuses = chatData.participants.map((id) => ({
            id,
            status: onlineUsers.has(id.toString()) ? "online" : "offline",
          }));

          if (statuses.length > 0) {
            // socket.emit("userStatus", statuses);
            io.to(chat.toString()).emit("userStatus", statuses);
          }

          for (const participantId of chatData.participants) {
            const participantSockets = onlineUsers.get(
              participantId.toString()
            );
            if (participantSockets) {
              const chats = await chatService.getMyChats(
                participantId.toString()
              );
              participantSockets.forEach((socketId) => {
                io.to(socketId).emit("updatedChats", chats);
              });
            }
          }

          // send notification if user inactive
          const isReceiverOnline = onlineUsers.has(receiver.toString());
          if (!isReceiverOnline) {
            const currentAuth = await Auth.findById(userId).populate(
              "user",
              "name"
            );

            const receiverAuth = await Auth.findById(receiver).select(
              "fcmToken"
            );

            // send notification
            const notificationPayload = {
              receiver,
              title: (currentAuth?.user as unknown as TTeacher)?.name,
              body: text,
            };

            await sendNotification(
              [receiverAuth?.fcmToken as string],
              notificationPayload
            );
          }
        }
      )
    );

    socket.on(
      "markSeen",
      withSocketErrorHandler(
        async ({
          messageId,
          chatId,
        }: {
          messageId: string;
          chatId: string;
        }) => {
          const chat = await Chat.findById(chatId);
          if (!chat || !chat.participants.includes(userId)) {
            throw new Error("Unauthorized or invalid chat");
          }

          const message = await Message.findByIdAndUpdate(
            messageId,
            { isSeen: true },
            { new: true }
          );
          if (message) {
            io.to(chatId).emit("messageUpdated", {
              _id: message._id,
              isSeen: true,
            });
          }
        }
      )
    );

    // Event to handle typing status
    socket.on("typing", ({ chatId }: { chatId: string }) => {
      if (typingUsers.has(chatId)) {
        const typingSet = typingUsers.get(chatId)!;
        if (!typingSet.has(userId)) {
          typingSet.add(userId);
          io.to(chatId).emit("typingStatus", {
            chatId,
            userId,
            status: "typing",
          });
        }
      }
    });

    socket.on("stopTyping", ({ chatId }: { chatId: string }) => {
      if (typingUsers.has(chatId)) {
        const typingSet = typingUsers.get(chatId)!;
        if (typingSet.has(userId)) {
          typingSet.delete(userId);
          io.to(chatId).emit("typingStatus", {
            chatId,
            userId,
            status: "stopped",
          });
        }
      }
    });

    socket.on("disconnect", () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
      }

      // remove user from onlineUsers map
      onlineUsers.delete(userId);

      // Clear typing status for all chats the user was in
      typingUsers.forEach((typingSet, chatId) => {
        if (typingSet.has(userId)) {
          typingSet.delete(userId);
          io.to(chatId).emit("typingStatus", {
            chatId,
            userId,
            status: "stopped",
          });
        }
      });
    });
  });

  return io;
};

export default initializeSocket;
