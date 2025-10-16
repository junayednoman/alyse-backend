import Asset from "./asset.model";
import { AppError } from "../../classes/appError";
import { TAsset } from "./asset.interface";
import QueryBuilder from "../../classes/queryBuilder";
import { ObjectId, startSession } from "mongoose";
import Auth from "../auth/auth.model";
import Category from "../category/category.model";
import { assetStatus, userRoles } from "../../constants/global.constant";
import { District } from "../district/district.model";
import fs from "fs";
import { sendEmail } from "../../utils/sendEmail";
import { format } from "date-fns";
import { TFile } from "../../interfaces/file.interface";
import { deleteFromS3, uploadToS3 } from "../../utils/awss3";
import chatService from "../chat/chat.service";
import Chat from "../chat/chat.model";
import { sendNotification } from "../../utils/sendNotification";
import { TAuth } from "../auth/auth.interface";

const createAsset = async (userId: string, payload: TAsset, files: TFile[]) => {
  const session = await startSession();

  const teacher = await Auth.findById(userId).populate("user");
  payload.teacher = teacher?._id as unknown as ObjectId;

  const teacherDistrict = await District.findById(
    (teacher?.user as any)?.district
  );
  if (teacherDistrict?.type === "non-strict") payload.status = "approved";
  payload.district = (teacher?.user as any)?.district as unknown as ObjectId;

  const category = await Category.findById(payload.category);
  if (!category) {
    throw new AppError(400, "Invalid category id!");
  }

  const imageUrls = [];
  if (files && files.length) {
    for (const file of files) {
      const image = await uploadToS3(file);
      imageUrls.push(image);
    }
  }
  payload.images = imageUrls;

  try {
    session.startTransaction();
    const asset = await Asset.create([payload], { session });
    await session.commitTransaction();
    return asset[0];
  } catch (error: any) {
    await session.abortTransaction();
    if (files) await Promise.all(imageUrls.map((url) => deleteFromS3(url)));
    throw new AppError(500, error.message || "Error creating asset!");
  } finally {
    session.endSession();
  }
};

const getAllAssets = async (userId: string, query: Record<string, any>) => {
  const searchableFields = ["name", "material"];
  const auth = await Auth.findById(userId).populate("user");
  if (auth?.role !== userRoles.admin)
    query.district = (auth?.user as any)?.district as unknown as ObjectId;

  if (auth?.role == userRoles.teacher) query.status = assetStatus.approved;
  if (auth?.role == userRoles.principal) query.status = assetStatus.pending;
  const assetQuery = new QueryBuilder(Asset.find(), query)
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .selectFields();

  const total = await assetQuery.countTotal();
  const result = await assetQuery.queryModel.populate([
    // { path: "category", select: "name" },
    {
      path: "teacher",
      select: "user role",
      populate: {
        path: "user",
        select: "name image email school district",
        populate: [
          {
            path: "school",
            select: "name",
          },
          {
            path: "district",
            select: "name",
          },
        ],
      },
    },
    // { path: "district", select: "name logo" }
  ]);

  const page = query.page || 1;
  const limit = query.limit || 10;
  const meta = { total, page, limit };

  return { data: result, meta };
};

const getSingleAsset = async (id: string) => {
  const asset = await Asset.findById(id).populate([
    { path: "category", select: "name" },
    {
      path: "teacher",
      select: "user role",
      populate: {
        path: "user",
        select: "name image email school",
        populate: {
          path: "school",
          select: "name",
        },
      },
    },
  ]);
  return asset;
};

const getMyPostedAssets = async (
  userId: string,
  query: Record<string, any>
) => {
  const searchableFields = ["name", "material"];
  query.teacher = userId;
  const categoryQuery = new QueryBuilder(Asset.find(), query)
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .selectFields();

  const total = await categoryQuery.countTotal();
  const result = await categoryQuery.queryModel.populate([
    { path: "category", select: "name" },
    { path: "district", select: "name logo" },
    {
      path: "teacher",
      select: "user role",
      populate: {
        path: "user",
        select: "name image email school",
        populate: {
          path: "school",
          select: "name",
        },
      },
    },
  ]);

  const page = query.page || 1;
  const limit = query.limit || 10;
  const meta = { total, page, limit };

  return { data: result, meta };
};

const getMyGrabbedAssets = async (
  userId: string,
  query: Record<string, any>
) => {
  const searchableFields = ["name", "material"];
  query.grabbedBy = userId;
  query.status = "grabbed";
  const categoryQuery = new QueryBuilder(Asset.find(), query)
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .selectFields();

  const total = await categoryQuery.countTotal();
  const result = await categoryQuery.queryModel.populate([
    { path: "category", select: "name" },
    { path: "district", select: "name logo" },
    {
      path: "teacher",
      select: "user role",
      populate: {
        path: "user",
        select: "name image email school",
        populate: {
          path: "school",
          select: "name",
        },
      },
    },
  ]);

  const page = query.page || 1;
  const limit = query.limit || 10;
  const meta = { total, page, limit };

  return { data: result, meta };
};

const lastGrabbedAsset = async (userId: string) => {
  const assets = await Asset.find({
    status: assetStatus.grabbed,
    teacher: userId,
  }).populate([
    { path: "category", select: "name" },
    { path: "district", select: "name logo" },
    {
      path: "teacher",
      select: "user role",
      populate: {
        path: "user",
        select: "name image email school",
        populate: {
          path: "school",
          select: "name",
        },
      },
    },
  ]);

  return assets[0];
};

const grabAsset = async (userId: string, id: string) => {
  const asset = await Asset.findById(id).populate([
    {
      path: "teacher",
      select: "user role",
      populate: { path: "user", select: "name email" },
    },
  ]);
  if (!asset) throw new AppError(400, "Invalid asset ID!");
  if (asset.status === assetStatus.grabbed)
    throw new AppError(400, "This asset is already grabbed!");

  const updated = await Asset.findByIdAndUpdate(
    id,
    { status: assetStatus.grabbed, grabbedBy: userId },
    { new: true }
  ).populate([
    {
      path: "teacher",
      select: "user role",
      populate: { path: "user", select: "name" },
    },
    { path: "district", select: "name" },
    {
      path: "grabbedBy",
      select: "user role",
      populate: { path: "user", select: "name" },
    },
  ]);

  let newChat = null;
  if (updated) {
    const subject = `Your asset has been grabbed - D.A.M`;
    const year = new Date().getFullYear().toString();
    const emailTemplatePath = "./src/app/emailTemplates/assetGrabbed.html";

    // Format
    const formattedDate = format((updated as any).createdAt, "MMM d, yyyy");
    const auth = await Auth.findById(userId).populate([
      {
        path: "user",
        select: "name email",
        populate: {
          path: "school",
          select: "name",
        },
      },
    ]);

    fs.readFile(emailTemplatePath, "utf8", (err, data) => {
      if (err) throw new AppError(500, err.message || "Something went wrong");
      const emailContent = data
        .replace("{{owner_name}}", (asset?.teacher as any)?.user.name)
        .replace("{{year}}", year)
        .replace("{{date_time}}", formattedDate)
        .replace("{{claimer_name}}", (auth?.user as any)?.name)
        .replace("{{asset_name}}", asset.name)
        .replace("{{claimer_school}}", (auth?.user as any)?.school.name);

      sendEmail((asset?.teacher as any)?.user?.email, subject, emailContent);
    });

    // create chat
    const chatPayload = {
      asset: id,
    } as any;
    const createdChat = await chatService.createChat(
      userId as any,
      chatPayload
    );
    newChat = await Chat.findById(createdChat?._id).populate([
      {
        path: "participants",
        select: "user role",
        populate: { path: "user", select: "name image" },
      },
    ]);

    // send notification
    const notificationPayload = {
      receiver: asset.teacher,
      title: "Asset Grabbed",
      body: `${(auth?.user as any)?.name} has grabbed your asset`,
    };

    await sendNotification(
      [(asset.teacher as unknown as TAuth).fcmToken as string],
      notificationPayload
    );
  }
  return { asset: updated, newChat };
};

const updateAsset = async (
  id: string,
  payload: Partial<TAsset>,
  files?: TFile[]
) => {
  const asset = await Asset.findById(id).populate("teacher", "fcmToken");
  if (!asset) throw new AppError(400, "Invalid asset ID!");

  if (payload.category) {
    const category = await Category.findById(payload.category);
    if (!category) throw new AppError(400, "Invalid category id!");
  }

  if (files && files.length) {
    const newImageUrls = await Promise.all(
      files.map((file) => uploadToS3(file))
    );
    payload.images = [...(asset.images || []), ...newImageUrls];
  }

  const updated = await Asset.findByIdAndUpdate(id, payload, { new: true });

  // send notification to user
  if (
    (updated && payload.status === assetStatus.approved) ||
    asset.status === assetStatus.denied
  ) {
    let notificationTitle;
    let notificationBody;

    if (payload.status === assetStatus.approved) {
      notificationTitle = "Asset Approved";
      notificationBody = `Your asset has been approved by the principal.`;
    } else if (payload.status === assetStatus.denied) {
      notificationTitle = "Asset Denied";
      notificationBody = `Your asset has been denied by the principal.`;
    }

    const notificationPayload = {
      receiver: asset.teacher,
      title: notificationTitle as string,
      body: notificationBody as string,
    };

    await sendNotification(
      [(asset.teacher as unknown as TAuth).fcmToken as string],
      notificationPayload
    );
  }
  return updated;
};

const deleteAssetImage = async (
  id: string,
  userId: string,
  imageUrl: string
) => {
  const asset = await Asset.findById(id);
  if (!asset) throw new AppError(400, "Invalid asset ID!");
  if (userId !== asset.teacher.toString())
    throw new AppError(
      401,
      "Unauthorized! Only the teacher can delete images."
    );

  if (!asset.images.includes(imageUrl))
    throw new AppError(400, "Image not found in asset!");
  await deleteFromS3(imageUrl);
  asset.images = asset.images.filter((img) => img !== imageUrl);
  const updated = await asset.save();
  return updated;
};

const deleteAsset = async (id: string, userId: string) => {
  const asset = await Asset.findById(id);
  if (!asset) throw new AppError(400, "Invalid asset ID!");
  if (userId !== asset.teacher.toString())
    throw new AppError(
      401,
      "Unauthorized! Only the teacher can delete this asset."
    );

  const deleted = await Asset.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
  return deleted;
};

export default {
  createAsset,
  getAllAssets,
  getMyPostedAssets,
  getMyGrabbedAssets,
  grabAsset,
  updateAsset,
  deleteAssetImage,
  deleteAsset,
  getSingleAsset,
  lastGrabbedAsset,
};
