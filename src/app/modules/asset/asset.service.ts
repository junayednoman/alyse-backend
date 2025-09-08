import Asset from "./asset.model";
import { AppError } from "../../classes/appError";
import { TAsset } from "./asset.interface";
import QueryBuilder from "../../classes/queryBuilder";
import { ObjectId, startSession } from "mongoose";
import { uploadMultipleToS3, uploadToS3 } from "../../utils/multerS3Uploader";
import { deleteFileFromS3 } from "../../utils/deleteFileFromS3";
import Auth from "../auth/auth.model";
import Category from "../category/category.model";
import deleteLocalFile from "../../utils/deleteLocalFile";
import { assetStatus, userRoles } from "../../constants/global.constant";
import { District } from "../district/district.model";
import fs from "fs";
import { sendEmail } from "../../utils/sendEmail";
import { format } from "date-fns";

const createAsset = async (userId: string, payload: TAsset, files: any[]) => {
  const session = await startSession();

  const teacher = await Auth.findById(userId).populate("user");
  payload.teacher = teacher?._id as unknown as ObjectId;

  const teacherDistrict = await District.findById((teacher?.user as any)?.district);
  if (teacherDistrict?.type === "non-strict") payload.status = "approved";
  payload.district = (teacher?.user as any)?.district as unknown as ObjectId;

  const category = await Category.findById(payload.category);
  if (!category) {
    files.map(file => deleteLocalFile(file.filename))
    throw new AppError(400, "Invalid category id!");
  }

  const imageUrls = await uploadMultipleToS3(files)
  payload.images = imageUrls

  try {
    session.startTransaction();
    const asset = await Asset.create([payload], { session });
    await session.commitTransaction();
    return asset[0];
  } catch (error: any) {
    await session.abortTransaction();
    if (files) await Promise.all(imageUrls.map(url => deleteFileFromS3(url)));
    throw new AppError(500, error.message || "Error creating asset!");
  } finally {
    session.endSession();
  }
};

const getAllAssets = async (userId: string, query: Record<string, any>) => {
  const searchableFields = ["name", "description", "material"];
  const auth = await Auth.findById(userId).populate("user")
  if (auth?.role !== userRoles.admin) query.district = ((auth?.user as any)?.district as unknown as ObjectId)

  if (auth?.role == userRoles.teacher) query.status = assetStatus.approved;
  if (auth?.role == userRoles.principal) query.status = assetStatus.pending;
  const assetQuery = new QueryBuilder(Asset.find(), query)
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .selectFields();

  const total = await assetQuery.countTotal();
  const result = await assetQuery.queryModel
    .populate([
      // { path: "category", select: "name" },
      {
        path: "teacher", select: "user role",
        populate: {
          path: "user", select: "name image email school",
          populate: {
            path: "school", select: "name"
          }
        }
      },
      // { path: "district", select: "name logo" }
    ])

  const page = query.page || 1;
  const limit = query.limit || 10;
  const meta = { total, page, limit };

  return { data: result, meta };
};

const getSingleAsset = async (id: string) => {
  const asset = await Asset.findById(id).populate([
    { path: "category", select: "name" },
    {
      path: "teacher", select: "user role",
      populate: {
        path: "user", select: "name image email school",
        populate: {
          path: "school", select: "name"
        }
      }
    },
  ]);
  return asset;
};

const getMyPostedAssets = async (userId: string) => {
  const assets = await Asset.find({ teacher: userId })
    .populate([
      { path: "category", select: "name" },
      { path: "district", select: "name logo" },
      {
        path: "teacher", select: "user role",
        populate: {
          path: "user", select: "name image email school",
          populate: {
            path: "school", select: "name"
          }
        }
      },
    ])
  return assets;
};

const getMyGrabbedAssets = async (userId: string) => {
  const assets = await Asset.find({ grabbedBy: userId, status: "grabbed" })
    .populate([
      { path: "category", select: "name" },
      { path: "district", select: "name logo" },
      {
        path: "teacher", select: "user role",
        populate: {
          path: "user", select: "name image email school",
          populate: {
            path: "school", select: "name"
          }
        }
      },
    ])
  return assets;
};

const grabAsset = async (userId: string, id: string) => {
  const asset = await Asset.findById(id)
    .populate([
      { path: "teacher", select: "user role", populate: { path: "user", select: "name email" } }
    ]);
  if (!asset) throw new AppError(400, "Invalid asset ID!");
  if (asset.status === assetStatus.grabbed) throw new AppError(400, "This asset is already grabbed!");

  const updated = await Asset.findByIdAndUpdate(id, { status: assetStatus.grabbed, grabbedBy: userId }, { new: true }).populate([
    { path: "teacher", select: "user role", populate: { path: "user", select: "name" } },
    { path: "district", select: "name" },
    { path: "grabbedBy", select: "user role", populate: { path: "user", select: "name" } }
  ]);
  if (updated) {
    const subject = `Your asset has been grabbed - D.A.M`;
    const year = new Date().getFullYear().toString();
    const emailTemplatePath = "./src/app/emailTemplates/assetGrabbed.html";

    // Format
    const formattedDate = format((updated as any).createdAt, 'MMM d, yyyy');
    const auth = await Auth.findById(userId).populate([
      {
        path: "user", select: "name email", populate: {
          path: "school", select: "name"
        }
      }
    ]);

    fs.readFile(emailTemplatePath, "utf8", (err, data) => {
      if (err) throw new AppError(500, err.message || "Something went wrong");
      const emailContent = data
        .replace('{{owner_name}}', (asset?.teacher as any)?.user.name)
        .replace('{{year}}', year)
        .replace('{{date_time}}', formattedDate)
        .replace('{{claimer_name}}', (auth?.user as any)?.name)
        .replace('{{claimer_school}}', (auth?.user as any)?.school.name)

      sendEmail((asset?.teacher as any)?.user?.email, subject, emailContent);
    })
  }
  return updated;
};

const updateAsset = async (id: string, userId: string, payload: Partial<TAsset>, files?: any[]) => {
  const asset = await Asset.findById(id);
  if (!asset) throw new AppError(400, "Invalid asset ID!");

  if (payload.category) {
    const category = await Category.findById(payload.category);
    if (!category) throw new AppError(400, "Invalid category id!");
  }

  if (files && files.length) {
    const newImageUrls = await Promise.all(files.map(file => uploadToS3(file)));
    payload.images = [...(asset.images || []), ...newImageUrls];
  }

  const updated = await Asset.findByIdAndUpdate(id, payload, { new: true });
  return updated;
};

const deleteAssetImage = async (id: string, userId: string, imageUrl: string) => {
  const asset = await Asset.findById(id);
  if (!asset) throw new AppError(400, "Invalid asset ID!");
  if (userId !== asset.teacher.toString()) throw new AppError(401, "Unauthorized! Only the teacher can delete images.");

  if (!asset.images.includes(imageUrl)) throw new AppError(400, "Image not found in asset!");
  await deleteFileFromS3(imageUrl);
  asset.images = asset.images.filter(img => img !== imageUrl);
  const updated = await asset.save();
  return updated;
};

const deleteAsset = async (id: string, userId: string) => {
  const asset = await Asset.findById(id);
  if (!asset) throw new AppError(400, "Invalid asset ID!");
  if (userId !== asset.teacher.toString()) throw new AppError(401, "Unauthorized! Only the teacher can delete this asset.");

  const deleted = await Asset.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
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
  getSingleAsset
};