import School from "./school.model";
import { AppError } from "../../classes/appError";
import { TSchool } from "./school.interface";
import { District } from "../district/district.model";
import QueryBuilder from "../../classes/queryBuilder";

const createSchool = async (payload: TSchool) => {
  const district = await District.findById(payload.district);
  if (!district) {
    throw new AppError(400, "Invalid district ID!");
  }

  const existing = await School.findOne({ name: payload.name, district: payload.district });
  if (existing) {
    throw new AppError(400, "School already exists!");
  }

  const school = await School.create(payload);
  return school;
};

const getAllSchools = async (query: Record<string, any>) => {
  const searchableFields = ["name"];

  const schoolQuery = new QueryBuilder(School.find(), query)
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .selectFields();

  const meta = await schoolQuery.countTotal();
  const result = await schoolQuery.queryModel.populate("district", "name code");
  return { data: result, meta };
};

const getSchoolById = async (id: string) => {
  const school = await School.findById(id).populate("district", "name code");
  if (!school) {
    throw new AppError(404, "School not found!");
  }
  return school;
};

const updateSchool = async (id: string, payload: Partial<TSchool>) => {
  const existing = await School.findById(id);
  if (!existing) {
    throw new AppError(400, "Invalid school ID!");
  }

  if (payload.district) {
    const district = await District.findById(payload.district);
    if (!district) {
      throw new AppError(400, "Invalid district ID!");
    }
  }

  const existingWithName = await School.findOne({ name: payload.name, district: payload.district || existing.district });
  if (existingWithName) {
    throw new AppError(400, "School already exists!");
  }

  const updated = await School.findByIdAndUpdate(id, payload, { new: true });
  return updated;
};

const deleteSchool = async (id: string) => {
  const existing = await School.findById(id);
  if (!existing) {
    throw new AppError(400, "Invalid school ID!");
  }
  throw new AppError(400, "check if any asset is assigned to this school");
  const deleted = await School.findByIdAndDelete(id);
  return deleted;
};

export default {
  createSchool,
  getAllSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
};