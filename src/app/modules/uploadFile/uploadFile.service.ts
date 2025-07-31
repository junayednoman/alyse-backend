import { AppError } from "../../classes/appError";
import { deleteSingleFileFromS3 } from "../../utils/deleteSingleFileFromS3";
import { uploadToS3 } from "../../utils/multerS3Uploader";

const uploadFile = async (file: any) => {
  if (!file || !file.filename) throw new AppError(400, "File is required!");
  const url = await uploadToS3(file);
  return { url };
}

const deleteFile = async (file_url: string) => {
  await deleteSingleFileFromS3(file_url);
}
export const uploadFileService = { uploadFile, deleteFile };