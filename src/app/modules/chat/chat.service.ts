import Chat from "./chat.model";
import { AppError } from "../../classes/appError";
import { TChat } from "./chat.interface";
import mongoose, { ObjectId, startSession } from "mongoose";
import Asset from "../asset/asset.model";
import Message from "../message/message.model";
import Auth from "../auth/auth.model";

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

const getMyChats = async (userId: string, limit: number = 10): Promise<any> => {
  const objectIdUserId = new mongoose.Types.ObjectId(userId); // Convert string to ObjectId

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
        preserveNullAndEmptyArrays: true, // Handle null lastMessage
      },
    },
    // Stage 3: Lookup participants from Auth model
    {
      $lookup: {
        from: Auth.collection.collectionName, // Dynamic collection name for Auth
        localField: "participants",
        foreignField: "_id",
        as: "participantsData",
      },
    },
    // Stage 4: Unwind participantsData to process each participant
    {
      $unwind: "$participantsData",
    },
    // Stage 5: Lookup user details (name, image) if user field references a User model
    {
      $lookup: {
        from: "teachers", // Assuming a User model exists with name and image
        localField: "participantsData.user",
        foreignField: "_id",
        as: "participantsData.userDetails",
        pipeline: [
          {
            $project: {
              _id: 1,
              name: 1,
              image: 1,
            },
          },
        ],
      },
    },
    // Stage 6: Group to rebuild the participants array with shaped data
    {
      $group: {
        _id: "$_id",
        lastMessage: { $first: "$lastMessage" },
        participants: {
          $push: {
            _id: "$participantsData._id",
            name: { $arrayElemAt: ["$participantsData.userDetails.name", 0] },
            image: { $arrayElemAt: ["$participantsData.userDetails.image", 0] },
            role: "$participantsData.role",
          },
        },
      },
    },
    // Stage 7: Lookup unseen message count
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
    // Stage 8: Project final shape with unseen count
    {
      $project: {
        lastMessage: 1,
        participants: 1,
        unseenCount: { $ifNull: [{ $arrayElemAt: ["$unseenMessages.unseenCount", 0] }, 0] },
      },
    },
    // Stage 9: Limit the number of results
    {
      $limit: limit,
    },
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