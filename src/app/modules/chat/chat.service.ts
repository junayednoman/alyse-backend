import Chat from "./chat.model";
import { AppError } from "../../classes/appError";
import { TChat } from "./chat.interface";
import mongoose, { ObjectId, startSession } from "mongoose";
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

    const existingChat = await Chat.findOne({ asset: payload.asset, participants: { $all: payload.participants } }).populate([
      { path: "participants", select: "user role", populate: { path: "user", select: "name image" } }
    ]);
    if (existingChat) return existingChat;

    await Chat.create([payload], { session });

    const result = await Chat.findOne({ asset: payload.asset }, {}, { session }).populate([
      { path: "participants", select: "user role", populate: { path: "user", select: "name image" } }
    ])

    await session.commitTransaction();
    return result;
  } catch (error: any) {
    await session.abortTransaction();
    throw new AppError(500, error.message || "Error creating chat!");
  } finally {
    session.endSession();
  }
};

const getMyChats = async (userId: string, limit: number = 10): Promise<any> => {
  const objectIdUserId = new mongoose.Types.ObjectId(userId);

  const chats = await Chat.aggregate([
    // Stage 1: Match chats where the user is a participant
    {
      $match: {
        participants: objectIdUserId,
      },
    },
    // Stage 2: Lookup lastMessage and unwind
    {
      $lookup: {
        from: Message.collection.collectionName, // Dynamic collection name
        localField: "lastMessage",
        foreignField: "_id",
        as: "lastMessage",
      },
    },
    {
      $unwind: {
        path: "$lastMessage",
        preserveNullAndEmptyArrays: true,
      },
    },
    // Stage 3: Lookup unseen message count
    {
      $lookup: {
        from: Message.collection.collectionName,
        let: { chatId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$chat", "$$chatId"] },
                  { $eq: ["$isSeen", false] },
                  { $ne: ["$sender", objectIdUserId] },
                ],
              },
            },
          },
          {
            $count: "unseenCount",
          },
        ],
        as: "unseenMessages",
      },
    },
    {
      $lookup: {
        from: "assets",
        localField: "asset",
        foreignField: "_id",
        as: "assetDetails",
      }
    },
    {
      $lookup: {
        from: "auths",
        localField: "participants",
        foreignField: "_id",
        as: "participantsAuths",
      }
    },
    {
      $lookup: {
        from: "teachers",
        localField: "participantsAuths.user",
        foreignField: "_id",
        as: "participants",
      }
    },
    // Stage 4: Project final shape with unseen count
    {
      $project: {
        lastMessage: { $ifNull: ["$lastMessage", null] },
        unseenCount: { $ifNull: [{ $arrayElemAt: ["$unseenMessages.unseenCount", 0] }, 0] },
        "assetDetails.name": 1,
        "assetDetails.images": 1,
        "assetDetails.description": 1,
        "assetDetails.quantity": 1,
        "participants.name": 1,
        "participants.image": 1,
        "participants._id": 1,
        "participantsAuths._id": 1
      },
    },
    // Stage 5: Sort by lastMessage createdAt (latest first)
    {
      $sort: { updatedAt: -1 }
    },
    // Stage 6: Limit the number of results
    {
      $limit: limit
    }
  ]);

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