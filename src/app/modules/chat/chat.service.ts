import Chat from "./chat.model";
import { AppError } from "../../classes/appError";
import { TChat } from "./chat.interface";
import { ObjectId, startSession } from "mongoose";
import Asset from "../asset/asset.model";
import Message from "../message/message.model";

const createChat = async (userId: ObjectId, payload: TChat) => {
  const asset = await Asset.findById(payload.asset);
  if (!asset) throw new AppError(400, "Invalid asset ID!")
  if (userId == asset.teacher) throw new AppError(400, "You cannot create a chat with yourself!");
  const session = await startSession();
  session.startTransaction();
  try {
    payload.participants = [
      userId,
      asset.teacher
    ]

    const existingChat = await Chat.findOne({ asset: payload.asset, participants: { $all: payload.participants } });
    if (existingChat) throw new AppError(400, "Chat already exists!");

    const chat = await Chat.create([payload], { session });
    await session.commitTransaction();
    return chat[0];
  } catch (error: any) {
    await session.abortTransaction();
    throw new AppError(500, error.message || "Error creating chat!");
  } finally {
    session.endSession();
  }
};

const getMyChats = async (userId: string) => {
  const chats = await Chat.find({ participants: userId })
    .populate([
      {
        path: "lastMessage",
      },
      {
        path: "participants",
        select: "user role",
        populate: {
          path: "user",
          select: "name image",
        }
      }
    ])
  return chats;
};

const deleteChat = async (id: string, userId: ObjectId) => {
  const chat = await Chat.findById(id);
  if (!chat) throw new AppError(400, "Invalid chat ID!");

  if (!chat.participants.includes(userId)) {
    throw new AppError(401, "Unauthorized! Only participants can delete this chat.");
  }

  const session = await startSession();
  session.startTransaction();
  try {
    const deleted = await Chat.findByIdAndDelete(id, { session });
    await Message.deleteMany({ chat: id }, { session });
    await session.commitTransaction();
    return deleted;
  } catch (error: any) {
    await session.abortTransaction();
    throw new AppError(500, error.message || "Error deleting chat!");
  } finally {
    session.endSession();
  }
};

export default {
  createChat,
  getMyChats,
  deleteChat,
};