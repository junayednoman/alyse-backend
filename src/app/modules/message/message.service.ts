import Message from "./message.model";
import { AppError } from "../../classes/appError";
import { TMessage } from "./message.interface";
import QueryBuilder from "../../classes/queryBuilder";
import { startSession } from "mongoose";
import { deleteFileFromS3 } from "../../utils/deleteFileFromS3";
import Chat from "../chat/chat.model";
import Asset from "../asset/asset.model";

const createMessage = async (payload: TMessage,) => {
  const session = await startSession();
  try {
    session.startTransaction();
    const chat = await Chat.findById(payload.chat);
    if (!payload.chat || !chat) throw new AppError(400, "Invalid chat ID!");
    const message = await Message.create([payload], { session });
    await Chat.findByIdAndUpdate(payload.chat, { lastMessage: message[0]._id }, { session });
    await session.commitTransaction();
    return message[0];
  } catch (error: any) {
    await session.abortTransaction();
    throw new AppError(500, error.message || "Error creating message!");
  } finally {
    session.endSession();
  }
};

const getMessagesByChatId = async (query: Record<string, any>) => {
  const searchableFields = ["text", "file"];
  const messageQuery = new QueryBuilder(Message.find(), query)
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .selectFields();

  const meta = await messageQuery.countTotal();
  const result = await messageQuery.queryModel.populate("chat", "asset").sort({ createdAt: 1 });

  const asset = await Asset.findById((result[0].chat as any).asset);

  return { asset, messages: result, meta };
};

const updateMessage = async (id: string, userId: string, payload: Partial<TMessage>) => {
  const message = await Message.findById(id);
  if (!message) throw new AppError(400, "Invalid message ID!");

  if (userId !== message.sender.toString() && payload.isSeen !== true) {
    throw new AppError(401, "Unauthorized! Only the sender can update text.");
  }

  const updated = await Message.findByIdAndUpdate(id, payload, { new: true });
  return updated;
};

const markMessagesAsSeen = async (chatId: string, userId: string) => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw new AppError(400, "Invalid chat ID!");
  const updatedMessages = await Message.updateMany({ chat: chatId, isSeen: false, sender: { $ne: userId } }, { isSeen: true });
  return updatedMessages;
};

const deleteMessage = async (id: string, userId: string) => {
  const message = await Message.findById(id);
  if (!message) throw new AppError(400, "Invalid message ID!");

  if (userId !== message.sender.toString()) {
    throw new AppError(401, "Unauthorized! Only the sender can delete this message.");
  }

  if (message.file) await deleteFileFromS3(message.file);
  const deleted = await Message.findByIdAndDelete(id);
  return deleted;
};

export default {
  createMessage,
  getMessagesByChatId,
  updateMessage,
  markMessagesAsSeen,
  deleteMessage,
};