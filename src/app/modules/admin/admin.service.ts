import { deleteFileFromS3 } from "../../utils/deleteFileFromS3";
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

const updateAdminProfileImage = async (email: string, image: Partial<TAdmin>) => {
  const admin = await Admin.findOne({ email });
  const result = await Admin.findOneAndUpdate({ email }, { image }, { new: true });
  if (result) {
    if (admin?.image) deleteFileFromS3(admin?.image.split(".com/")[1]);
  }
  return result;
};

export const adminServices = { updateAdminProfile, getAdminProfile, updateAdminProfileImage };
