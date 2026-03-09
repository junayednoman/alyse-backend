import { AppError } from "../../classes/appError";
import QueryBuilder from "../../classes/queryBuilder";
import { TDistrict } from "./district.interface";
import { District } from "./district.model";
import School from "../school/school.model";
import { deleteFromS3, uploadToS3 } from "../../utils/awss3";
import { TFile } from "../../interfaces/file.interface";
import { TVerifyCode } from "./district.validation";
import { startSession } from "mongoose";
import Teacher from "../teacher/teacher.model";
import Principal from "../principal/principal.model";
import Auth from "../auth/auth.model";
import Asset from "../asset/asset.model";
import Chat from "../chat/chat.model";
import Message from "../message/message.model";
import Notification from "../notification/notification.model";
import { userRoles } from "../../constants/global.constant";

const createDistrict = async (payload: TDistrict, file: TFile) => {
  const existing = await District.findOne({ name: payload.name });
  if (existing) throw new AppError(400, "District already exists!");

  payload.logo = await uploadToS3(file);
  return await District.create(payload);
};

const verifyCode = async (payload: TVerifyCode) => {
  const district = await District.findById(payload.district);
  if (!district) throw new AppError(400, "Invalid district id!");
  if (district.code !== payload.code) throw new AppError(400, "Invalid code!");
};

const getDistricts = async (query: Record<string, any>) => {
  const searchableFields = ["name", "code", "logo"];
  const userQuery = new QueryBuilder(District.find(), query)
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .selectFields();

  const total = await userQuery.countTotal();
  const result = await userQuery.queryModel;

  const page = query.page || 1;
  const limit = query.limit || 10;
  const meta = { total, page, limit };

  return { data: result, meta };
};

const updateDistrict = async (id: string, payload: TDistrict, file?: TFile) => {
  const district = await District.findById(id);
  if (!district) {
    throw new AppError(400, "Invalid district id!");
  }

  if (file) {
    const logo = await uploadToS3(file);
    payload.logo = logo;
  }

  const result = await District.findByIdAndUpdate(district._id, payload, {
    new: true,
  });
  if (payload.logo && result) await deleteFromS3(district?.logo);
  return result;
};

const toggleDistrictBlock = async (id: string) => {
  const district = await District.findById(id);
  if (!district) {
    throw new AppError(400, "Invalid district id!");
  }

  const result = await District.findByIdAndUpdate(
    district._id,
    {
      isBlocked: !district.isBlocked,
    },
    { new: true },
  );
  const message = `District ${
    result?.isBlocked ? "blocked" : "unblocked"
  } successfully!`;
  return { result, message };
};

const deleteDistrict = async (id: string) => {
  const district = await District.findById(id);
  if (!district) {
    throw new AppError(400, "Invalid district id!");
  }

  const session = await startSession();
  const fileUrlsToDelete = [district.logo];

  try {
    session.startTransaction();

    const teachers = await Teacher.find({ district: id })
      .select("_id image")
      .session(session);
    const principals = await Principal.find({ district: id })
      .select("_id image")
      .session(session);

    const teacherIds = teachers.map((teacher) => teacher._id);
    const principalIds = principals.map((principal) => principal._id);

    const authOrFilters = [];
    if (teacherIds.length) {
      authOrFilters.push({
        role: userRoles.teacher,
        user: { $in: teacherIds },
      });
    }
    if (principalIds.length) {
      authOrFilters.push({
        role: userRoles.principal,
        user: { $in: principalIds },
      });
    }

    const auths = authOrFilters.length
      ? await Auth.find({ $or: authOrFilters }).select("_id").session(session)
      : [];
    const authIds = auths.map((auth) => auth._id);

    const assets = await Asset.find({ district: id })
      .select("_id images")
      .session(session);
    const assetIds = assets.map((asset) => asset._id);

    const chatOrFilters = [];
    if (assetIds.length) {
      chatOrFilters.push({ asset: { $in: assetIds } });
    }
    if (authIds.length) {
      chatOrFilters.push({ participants: { $in: authIds } });
    }

    const chats = chatOrFilters.length
      ? await Chat.find({ $or: chatOrFilters }).select("_id").session(session)
      : [];
    const chatIds = chats.map((chat) => chat._id);

    const messageOrFilters = [];
    if (chatIds.length) {
      messageOrFilters.push({ chat: { $in: chatIds } });
    }
    if (authIds.length) {
      messageOrFilters.push({ sender: { $in: authIds } });
      messageOrFilters.push({ receiver: { $in: authIds } });
    }

    const messages = messageOrFilters.length
      ? await Message.find({ $or: messageOrFilters })
          .select("file")
          .session(session)
      : [];

    teachers.forEach((teacher) => {
      if (teacher.image) fileUrlsToDelete.push(teacher.image);
    });
    principals.forEach((principal) => {
      if (principal.image) fileUrlsToDelete.push(principal.image);
    });
    assets.forEach((asset) => {
      if (asset.images?.length) fileUrlsToDelete.push(...asset.images);
    });
    messages.forEach((message) => {
      if (message.file) fileUrlsToDelete.push(message.file);
    });

    if (authIds.length) {
      await Notification.deleteMany(
        { receiver: { $in: authIds } },
        { session },
      );
    }

    if (messageOrFilters.length) {
      await Message.deleteMany({ $or: messageOrFilters }, { session });
    }
    if (chatOrFilters.length) {
      await Chat.deleteMany({ $or: chatOrFilters }, { session });
    }

    await Asset.deleteMany({ district: id }, { session });

    if (authIds.length) {
      await Auth.deleteMany({ _id: { $in: authIds } }, { session });
    }

    await Teacher.deleteMany({ district: id }, { session });
    await Principal.deleteMany({ district: id }, { session });
    await School.deleteMany({ district: id }, { session });
    const result = await District.findByIdAndDelete(district._id, { session });

    await session.commitTransaction();

    const uniqueUrls = [...new Set(fileUrlsToDelete)];
    await Promise.all(uniqueUrls.map((url) => deleteFromS3(url)));

    return result;
  } catch (error: any) {
    await session.abortTransaction();
    throw new AppError(
      500,
      error.message || "Error deleting district and associated resources!",
    );
  } finally {
    await session.endSession();
  }
};

const districtService = {
  createDistrict,
  verifyCode,
  getDistricts,
  updateDistrict,
  deleteDistrict,
  toggleDistrictBlock,
};

export default districtService;
