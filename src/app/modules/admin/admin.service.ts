import { TFile } from "../../interfaces/file.interface";
import { deleteFromS3, uploadToS3 } from "../../utils/awss3";
import { TAdmin } from "./admin.interface";
import Admin from "./admin.model";

const getAdminProfile = async (email: string) => {
  const admin = await Admin.findOne({ email }).select("email name image phone");
  return admin;
};

const updateAdminProfile = async (email: string, payload: Partial<TAdmin>) => {
  const result = await Admin.findOneAndUpdate({ email }, payload, { new: true });
  return result;
};

const updateAdminProfileImage = async (email: string, file: TFile) => {
  if (!file) throw new Error("Image is required!");
  const admin = await Admin.findOne({ email });
  const image = await uploadToS3(file);
  const result = await Admin.findOneAndUpdate({ email }, { image }, { new: true });
  if (result) {
    if (image && admin?.image) deleteFromS3(admin?.image);
  }
  return result;
};

export const adminServices = { updateAdminProfile, getAdminProfile, updateAdminProfileImage };
