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
import { assetStatus } from "../../constants/global.constant";
import { District } from "../district/district.model";

const createAsset = async (userId: string, payload: TAsset, files: any[]) => {
  const session = await startSession();

  const teacher = await Auth.findById(userId).populate("user");
  payload.teacher = teacher?._id as unknown as ObjectId;

  const teacherDistrict = await District.findById((teacher?.user as any)?.district);
  if (teacherDistrict?.type === "non-strict") payload.isApproved = true;
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
  query.district = ((auth?.user as any)?.district as unknown as ObjectId)
  const assetQuery = new QueryBuilder(Asset.find(), query)
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .selectFields();

  const meta = await assetQuery.countTotal();
  const result = await assetQuery.queryModel
  return { data: result, meta };
};

const getMyPostedAssets = async (userId: string) => {
  const assets = await Asset.find({ teacher: userId })
    .populate("category", "name")
    .populate("grabbedBy", "email");
  return assets;
};

const getMyGrabbedAssets = async (userId: string) => {
  const assets = await Asset.find({ grabbedBy: userId, status: "grabbed" })
    .populate("category", "name")
    .populate("teacher", "email");
  return assets;
};

const grabAsset = async (userId: string, id: string) => {
  const asset = await Asset.findById(id);
  if (!asset) throw new AppError(400, "Invalid asset ID!");

  const updated = await Asset.findByIdAndUpdate(id, { status: assetStatus.grabbed, grabbedBy: userId }, { new: true });
  return updated;
};

const updateAsset = async (id: string, userId: string, payload: Partial<TAsset>, files?: any[]) => {
  const asset = await Asset.findById(id);
  if (!asset) throw new AppError(400, "Invalid asset ID!");
  if (userId !== asset.teacher.toString()) throw new AppError(401, "Unauthorized! Only the teacher can update this asset.");

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
};