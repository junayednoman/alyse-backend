import Message from "./message.model";
import { AppError } from "../../classes/appError";
import { TMessage } from "./message.interface";
import QueryBuilder from "../../classes/queryBuilder";
import { startSession } from "mongoose";
import Chat from "../chat/chat.model";
import Asset from "../asset/asset.model";
import { deleteFromS3 } from "../../utils/awss3";

const createMessage = async (payload: TMessage) => {
  const session = await startSession();
  try {
    session.startTransaction();
    const message = await Message.create([payload], { session });
    await Chat.findByIdAndUpdate(
      payload.chat,
      { lastMessage: message[0]._id },
      { session }
    );
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
  const chat = await Chat.findById(query.chat);
  if (!chat) throw new AppError(400, "Invalid chat ID!");
  const searchableFields = ["text", "file"];
  const messageQuery = new QueryBuilder(Message.find(), query)
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .selectFields()
    .sort();

  const total = await messageQuery.countTotal();
  const messages = await messageQuery.queryModel.populate("chat", "asset");

  const asset = await Asset.findById(chat.asset);
  // .populate([
  //   {
  //     path: "teacher",
  //     select: "user role",
  //     populate: [
  //       {
  //         path: "user",
  //         select: "roomNumber school",
  //         populate: [{ path: "school", select: "name" }],
  //       },
  //     ],
  //   },
  // ]);
  const page = query.page || 1;
  const limit = query.limit || 10;
  const meta = { total, page, limit };

  const sortedMessages = messages.sort(
    (a: any, b: any) => a.createdAt - b.createdAt
  );
  return { asset, messages: sortedMessages, meta };
};

const updateMessage = async (
  id: string,
  userId: string,
  payload: Partial<TMessage>
) => {
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
  const updatedMessages = await Message.updateMany(
    { chat: chatId, isSeen: false, sender: { $ne: userId } },
    { isSeen: true }
  );
  return updatedMessages;
};

const deleteMessage = async (id: string, userId: string) => {
  const message = await Message.findById(id);
  if (!message) throw new AppError(400, "Invalid message ID!");

  if (userId !== message.sender.toString()) {
    throw new AppError(
      401,
      "Unauthorized! Only the sender can delete this message."
    );
  }

  if (message.file) await deleteFromS3(message.file);
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
