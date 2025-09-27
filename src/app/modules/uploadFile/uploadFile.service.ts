import { AppError } from "../../classes/appError";
import { TFile } from "../../interfaces/file.interface";
import { deleteFromS3, uploadToS3 } from "../../utils/awss3";

const uploadFile = async (file: TFile) => {
  if (!file) throw new AppError(400, "File is required!");
  const url = await uploadToS3(file);
  return { url };
}

const deleteFile = async (fileUrl: string) => {
  await deleteFromS3(fileUrl);
}
export const uploadFileService = { uploadFile, deleteFile };