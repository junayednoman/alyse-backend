import Category from "./category.model";
import { AppError } from "../../classes/appError";
import { TCategory } from "./category.interface";
import QueryBuilder from "../../classes/queryBuilder";

const createCategory = async (payload: TCategory) => {
  const existing = await Category.findOne({ name: payload.name });
  if (existing) throw new AppError(400, "Category already exists!");

  const category = await Category.create(payload);
  return category;
};

const getAllCategories = async (query: Record<string, any>) => {
  const searchableFields = ["name"];

  const categoryQuery = new QueryBuilder(Category.find(), query)
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .selectFields();

  const meta = await categoryQuery.countTotal();
  const result = await categoryQuery.queryModel;
  return { data: result, meta };
};

const updateCategory = async (id: string, payload: Partial<TCategory>) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError(400, "Invalid category ID!");
  }

  const existingWithName = await Category.findOne({ name: payload.name });
  if (existingWithName) throw new AppError(400, "Category already exists!");

  const updated = await Category.findByIdAndUpdate(id, payload, { new: true });
  return updated;
};

const deleteCategory = async (id: string) => {
  const existing = await Category.findById(id);
  if (!existing) {
    throw new AppError(400, "Invalid category ID!");
  }
  throw new AppError(400, "check if any asset is assigned to this category");
  const deleted = await Category.findByIdAndDelete(id);
  return deleted;
};

export default {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};