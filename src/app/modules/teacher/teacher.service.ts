import Teacher from "./teacher.model";
import { AppError } from "../../classes/appError";
import { TTeacher } from "./teacher.interface";
import QueryBuilder from "../../classes/queryBuilder";
import { startSession } from "mongoose";
import { uploadToS3 } from "../../utils/multerS3Uploader";
import deleteLocalFile from "../../utils/deleteLocalFile";
import bcrypt from "bcrypt";
import config from "../../config";
import { userRoles } from "../../constants/global.constant";
import generateOTP from "../../utils/generateOTP";
import Auth from "../auth/auth.model";
import { deleteFileFromS3 } from "../../utils/deleteFileFromS3";
import fs from "fs";
import { sendEmail } from "../../utils/sendEmail";
import { District } from "../district/district.model";
import School from "../school/school.model";
import Asset from "../asset/asset.model";

const teacherSignup = async ({ password, ...payload }: TTeacher & { password: string }, file?: any) => {
  const auth = await Auth.findOne({ email: payload.email, isAccountVerified: true });
  if (auth) {
    deleteLocalFile(file?.filename)
    throw new AppError(400, "User already exists!");
  }

  const session = await startSession();
  session.startTransaction();

  try {
    const district = await District.findById(payload.district)
    if (!district) {
      deleteLocalFile(file?.filename)
      throw new AppError(400, "Invalid district ID!");
    }

    const school = await School.findById(payload.school)
    if (!school) {
      deleteLocalFile(file?.filename)
      throw new AppError(400, "Invalid school ID!");
    }

    if (file) {
      const image = await uploadToS3(file)
      payload.image = image
    }

    const teacher = await Teacher.findOneAndUpdate({ email: payload.email }, payload, { upsert: true, new: true });

    // hash password
    const hashedPassword = await bcrypt.hash(
      password,
      Number(config.salt_rounds)
    );

    // prepare auth data
    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(
      otp.toString(),
      Number(config.salt_rounds)
    );

    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

    const authData = {
      email: payload.email,
      password: hashedPassword,
      user: teacher?._id,
      role: userRoles.teacher,
      otp: hashedOtp,
      otpExpires,
      otpAttempts: 0,
    }

    await Auth.findOneAndUpdate({ email: payload.email }, authData, { upsert: true });

    if (teacher) {
      // send otp
      const emailTemplatePath = "./src/app/emailTemplates/otp.html";
      const subject = `Your OTP Code is Here - D.A.M`;
      const year = new Date().getFullYear().toString();
      fs.readFile(emailTemplatePath, "utf8", (err, data) => {
        if (err) throw new AppError(500, err.message || "Something went wrong");
        const emailContent = data
          .replace('{{otp}}', otp.toString())
          .replace('{{year}}', year);

        sendEmail(payload.email, subject, emailContent);
      })
    }

    await session.commitTransaction();
    return teacher;
  } catch (error: any) {
    await session.abortTransaction();
    if (payload.image) await deleteFileFromS3(payload.image)
    throw new AppError(500, error.message || "Error signing up teacher!");
  } finally {
    session.endSession();
  }
};

const getAllTeachers = async (query: Record<string, any>) => {
  const searchableFields = ["name", "email", "roomNumber"];
  query.role = userRoles.teacher
  query.fields = query.fields || "isBlocked user role"
  const teacherQuery = new QueryBuilder(Auth.find(), query)
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .selectFields();

  const meta = await teacherQuery.countTotal();
  const result = await teacherQuery.queryModel.populate([
    {
      path: "user",
      populate: [{ path: "district", select: "name logo code type" }, { path: "school", select: "name" }],
    }
  ])
  return { data: result, meta };
};

const getSingleTeacher = async (id: string) => {
  const teacher = await Auth.findById(id).select("isBlocked user role").populate("user");
  const assets = await Asset.find({ teacher: id }).populate("category", "name");
  return { teacher, assets };
}

const getTeachersByDistrictId = async (districtId: string, query: Record<string, any>) => {
  const searchableFields = ["name", "email", "roomNumber"];
  query.district = districtId

  const teacherQuery = new QueryBuilder(Teacher.find(), query)
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .selectFields();

  const meta = await teacherQuery.countTotal();
  const result = await teacherQuery.queryModel.populate("school", "name").populate("district", "name");
  return { data: result, meta };
};

const getTeacherProfile = async (email: string) => {
  const teacher = await Teacher.findOne({ email });

  return teacher;
};

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
const updateTeacherProfile = async (userEmail: string, { email, ...payload }: Partial<TTeacher>) => {
  const teacher = await Teacher.findOne({ email: userEmail });
  if (payload.district) {
    const school = await School.findById(payload.school);
    if (!school) {
      throw new AppError(400, "Invalid school ID!");
    }
  }

  if (payload.school) {
    const district = await District.findById(payload.district);
    if (!district) {
      throw new AppError(400, "Invalid district ID!");
    }
  }

  const updated = await Teacher.findByIdAndUpdate(teacher?._id, payload, { new: true });
  return updated;
};

const updateTeacherProfileImage = async (email: string, file: any) => {
  const teacher = await Teacher.findOne({ email });
  if (!teacher) {
    deleteLocalFile(file.filename)
    throw new AppError(400, "Invalid teacher ID!");
  }
  const image = await uploadToS3(file)
  const payload = { image: image };
  const updated = await Teacher.findByIdAndUpdate(teacher._id, payload, { new: true });
  if (teacher?.image) await deleteFileFromS3(teacher?.image)
  return updated;
};

export default {
  teacherSignup,
  getAllTeachers,
  getTeachersByDistrictId,
  getTeacherProfile,
  updateTeacherProfile,
  updateTeacherProfileImage,
  getSingleTeacher
};