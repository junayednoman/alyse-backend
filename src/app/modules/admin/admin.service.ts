import { userRoles } from "../../constants/global.constant";
import { TFile } from "../../interfaces/file.interface";
import { deleteFromS3, uploadToS3 } from "../../utils/awss3";
import Auth from "../auth/auth.model";
import Principal from "../principal/principal.model";
import { TAdmin } from "./admin.interface";
import Admin from "./admin.model";

const getAdminProfile = async (email: string) => {
  const auth = await Auth.findOne({ email });
  let result = null;
  if (auth?.role === userRoles.admin) {
    result = await Admin.findOne({ email }).select("email name image phone");
  } else if (auth?.role === userRoles.principal) {
    result = await Principal.findOne({ email }).select(
      "email name image phone"
    );
  }
  return result;
};

const updateAdminProfile = async (email: string, payload: Partial<TAdmin>) => {
  const auth = await Auth.findOne({ email });

  let result = null;
  if (auth?.role === userRoles.admin) {
    result = await Admin.findOneAndUpdate({ email }, payload, {
      new: true,
    });
  } else if (auth?.role === userRoles.principal) {
    result = await Principal.findOneAndUpdate({ email }, payload, {
      new: true,
    });
  }
  return result;
};

const updateAdminProfileImage = async (email: string, file: TFile) => {
  if (!file) throw new Error("Image is required!");
  const admin = await Admin.findOne({ email });
  const image = await uploadToS3(file);
  const auth = await Auth.findOne({ email });

  let result = null;
  if (auth?.role === userRoles.admin) {
    result = await Admin.findOneAndUpdate({ email }, { image }, { new: true });
    if (result) {
      if (image && admin?.image) deleteFromS3(admin?.image);
    }
  } else if (auth?.role === userRoles.principal) {
    result = await Principal.findOneAndUpdate(
      { email },
      { image },
      { new: true }
    );
    if (result) {
      if (image && admin?.image) deleteFromS3(admin?.image);
    }
  }
  return result;
};

export const adminServices = {
  updateAdminProfile,
  getAdminProfile,
  updateAdminProfileImage,
};
