import { AppError } from "../../classes/appError";
import { deleteFileFromS3 } from "../../utils/deleteFileFromS3";
import { uploadToS3 } from "../../utils/multerS3Uploader";

const uploadFile = async (file: any) => {
  if (!file || !file.filename) throw new AppError(400, "File is required!");
  const url = await uploadToS3(file);
  return { url };
}

const deleteFile = async (fileUrl: string) => {
  await deleteFileFromS3(fileUrl);
}
export const uploadFileService = { uploadFile, deleteFile };