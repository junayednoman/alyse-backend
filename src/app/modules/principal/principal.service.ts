import Principal from "./principal.model";
import { AppError } from "../../classes/appError";
import { TPrincipal } from "./principal.interface";
import { startSession } from "mongoose";
import { userRoles } from "../../constants/global.constant";
import Auth from "../auth/auth.model";
import QueryBuilder from "../../classes/queryBuilder";
import { TFile, uploadToS3 } from "../../utils/multerS3Uploader";
import { deleteFileFromS3 } from "../../utils/deleteFileFromS3";
import deleteLocalFile from "../../utils/deleteLocalFile";

const addPrincipal = async (payload: TPrincipal) => {
  const existing = await Principal.findOne({ email: payload.email });
  if (existing) throw new AppError(400, "Principal with this email already exists!");
  const existingWithDistrictId = await Principal.findOne({ district: payload.district });
  if (existingWithDistrictId) throw new AppError(400, "Principal with this district already exists!");

  const session = await startSession();
  try {
    session.startTransaction();
    const principal = await Principal.create([payload], { session });
    const authData = {
      email: payload.email,
      password: "",
      user: principal[0]._id,
      role: userRoles.principal,
      isAccountVerified: true,
      needsPasswordChange: true
    }

    await Auth.create([authData], { session });
    await session.commitTransaction();
    return principal;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const getAllPrincipals = async (query: Record<string, any>) => {
  const searchableFields = ["name", "email", "phone", "image"];

  const categoryQuery = new QueryBuilder(Principal.find(), query)
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .selectFields();

  const meta = await categoryQuery.countTotal();
  const result = await categoryQuery.queryModel;
  return { data: result, meta };
};

const getPrincipalById = async (id: string) => {
  const principal = await Principal.findById(id);
  return principal;
};

const getPrincipalProfile = async (email: string) => {
  const principal = await Principal.findOne({ email });
  return principal;
}

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
const updatePrincipalProfile = async (userEmail: string, { email, ...payload }: Partial<TPrincipal>) => {
  const principal = await Principal.findOne({ email: userEmail });
  if (!principal) throw new AppError(400, "Invalid principal ID!");

  const updated = await Principal.findByIdAndUpdate(principal._id, payload, { new: true });
  return updated;
};

const updatePrincipalImage = async (email: string, file: TFile) => {
  if (!file) throw new AppError(400, "Image is required!");
  const principal = await Principal.findOne({ email });
  if (!principal) {
    deleteLocalFile(file.filename);
    throw new AppError(400, "Invalid principal ID!");
  }
  const image = await uploadToS3(file);

  const updated = await Principal.findByIdAndUpdate(principal._id, { image }, { new: true });
  if (principal?.image && updated) {
    await deleteFileFromS3(principal?.image)
  }
  return updated;
};

const changePrincipalStatus = async (id: string) => {
  const principal = await Principal.findById(id);
  const auth = await Auth.findOne({ user: id });
  if (!principal) throw new AppError(400, "Invalid principal ID!");

  await Auth.findByIdAndUpdate(auth?._id, { isBlocked: auth?.isBlocked ? false : true }, { new: true });
  return principal;
};

export default {
  addPrincipal,
  getAllPrincipals,
  getPrincipalProfile,
  getPrincipalById,
  updatePrincipalProfile,
  updatePrincipalImage,
  changePrincipalStatus,
};