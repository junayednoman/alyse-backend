import { AppError } from "../../classes/appError";
import QueryBuilder from "../../classes/queryBuilder";
import { TDistrict } from "./district.interface";
import { District } from "./district.model";
import School from "../school/school.model";
import { deleteFromS3, uploadToS3 } from "../../utils/awss3";
import { TFile } from "../../interfaces/file.interface";
import { TVerifyCode } from "./district.validation";

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
    { new: true }
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

  // check if any school is assigned to this district
  const associatedSchools = await School.findOne({ district: id });
  if (associatedSchools) {
    throw new AppError(400, "Schools are assigned to this district!");
  }
  const result = await District.findByIdAndDelete(district._id);
  if (result) await deleteFromS3(result?.logo);
  return result;
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
