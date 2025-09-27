import Principal from "./principal.model";
import { AppError } from "../../classes/appError";
import { TPrincipal } from "./principal.interface";
import { startSession } from "mongoose";
import { userRoles } from "../../constants/global.constant";
import Auth from "../auth/auth.model";
import QueryBuilder from "../../classes/queryBuilder";
import fs from "fs";
import { sendEmail } from "../../utils/sendEmail";
import generateOTP from "../../utils/generateOTP";
import config from "../../config";
import bcrypt from "bcrypt";
import { deleteFromS3, uploadToS3 } from "../../utils/awss3";
import { TFile } from "../../interfaces/file.interface";

const addPrincipal = async (payload: TPrincipal) => {
  const existing = await Auth.findOne({ email: payload.email, isOtpVerified: true });
  if (existing) throw new AppError(400, "Principal with this email already exists!");
  const existingWithDistrictId = await Principal.findOne({ district: payload.district });
  if (existingWithDistrictId) throw new AppError(400, "Principal with this district already exists!");

  const session = await startSession();
  const tempPassword = generateOTP();
  const hashedPass = await bcrypt.hash(
    `dam-${tempPassword.toString()}`,
    Number(config.salt_rounds)
  );

  try {
    session.startTransaction();
    const principal = await Principal.create([payload], { session });
    const authData = {
      email: payload.email,
      password: hashedPass,
      user: principal[0]._id,
      role: userRoles.principal,
      isAccountVerified: true,
      provider: "email"
    }

    await Auth.create([authData], { session });

    if (principal) {
      const subject = `Access your account - D.A.M`;
      const year = new Date().getFullYear().toString();
      const emailTemplatePath = "./src/app/emailTemplates/principalInform.html";
      fs.readFile(emailTemplatePath, "utf8", (err, data) => {
        if (err) throw new AppError(500, err.message || "Something went wrong");
        const emailContent = data
          .replace('{{password}}', `dam-${tempPassword.toString()}`)
          .replace('{{year}}', year);

        return sendEmail(payload.email, subject, emailContent);
      })
    }

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
  query.role = userRoles.principal
  query.fields = query.fields || "isBlocked user role"
  const categoryQuery = new QueryBuilder(Auth.find(), query)
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .selectFields();

  const total = await categoryQuery.countTotal();
  const result = await categoryQuery.queryModel.populate([
    { path: "user", populate: { path: "district", select: "name logo code type" } }
  ]);

  const page = query.page || 1;
  const limit = query.limit || 10;
  const meta = { total, page, limit };

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
    throw new AppError(400, "Invalid principal ID!");
  }
  const image = await uploadToS3(file);

  const updated = await Principal.findByIdAndUpdate(principal._id, { image }, { new: true });
  if (principal?.image && image && updated) {
    await deleteFromS3(principal?.image)
  }
  return updated;
};

export default {
  addPrincipal,
  getAllPrincipals,
  getPrincipalProfile,
  getPrincipalById,
  updatePrincipalProfile,
  updatePrincipalImage,
};