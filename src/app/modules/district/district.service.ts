import { AppError } from "../../classes/appError";
import QueryBuilder from "../../classes/queryBuilder";
import deleteLocalFile from "../../utils/deleteLocalFile";
import { deleteFileFromS3 } from "../../utils/deleteFileFromS3";
import { TFile, uploadToS3 } from "../../utils/multerS3Uploader";
import { TDistrict } from "./district.interface";
import { District } from "./district.model";

const createDistrict = async (payload: TDistrict, file: TFile) => {
  const logo = await uploadToS3(file)
  payload.logo = logo
  return await District.create(payload);
}

const getDistricts = async (query: Record<string, any>) => {
  const searchableFields = [
    "name",
    "code",
    "logo",
  ];
  const userQuery = new QueryBuilder(
    District.find(),
    query
  )
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .selectFields();

  const meta = await userQuery.countTotal();
  const result = await userQuery.queryModel;

  return { data: result, meta };
}

const updateDistrict = async (id: string, payload: TDistrict, file?: TFile) => {
  const district = await District.findById(id);
  if (!district) {
    if (file) {
      deleteLocalFile(file.filename)
    }
    throw new AppError(400, "Invalid district id!");
  }
  if (file) {
    const logo = await uploadToS3(file)
    payload.logo = logo
  }

  const result = await District.findByIdAndUpdate(district._id, payload, { new: true });
  if (payload.logo && result) await deleteFileFromS3(district?.logo)
  return result;
}

const deleteDistrict = async (id: string) => {
  const district = await District.findById(id);
  if (!district) {
    throw new AppError(400, "Invalid district id!");
  }

  // check if any school is assigned to this district
  return

  const result = await District.findByIdAndDelete(district._id);
  if (result) await deleteFileFromS3(result?.logo)
  return result;
}

const districtService = {
  createDistrict,
  getDistricts,
  updateDistrict,
  deleteDistrict
}

export default districtService