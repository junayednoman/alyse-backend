import Category from "./category.model";
import { AppError } from "../../classes/appError";
import { TCategory } from "./category.interface";
import QueryBuilder from "../../classes/queryBuilder";
import Asset from "../asset/asset.model";

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

  const page = query.page || 1;
  const limit = query.limit || 10;

  return { data: result, meta, page, limit };
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
  const asset = await Asset.findOne({ category: id });
  if (asset) throw new AppError(400, "Category has assets, cannot delete!");
  const deleted = await Category.findByIdAndDelete(id);
  return deleted;
};

export default {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};