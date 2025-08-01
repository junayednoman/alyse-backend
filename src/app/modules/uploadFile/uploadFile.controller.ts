import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { successResponse } from "../../utils/successResponse";
import { uploadFileService } from "./uploadFile.service";

const uploadFile = handleAsyncRequest(async (req: any, res) => {
  const file = req.file;
  const result = await uploadFileService.uploadFile(file);
  successResponse(res, {
    message: "File uploaded successfully!",
    data: result,
  });
});

const deleteFile = handleAsyncRequest(async (req: any, res) => {
  const fileUrl = req.body.fileUrl;
  const result = await uploadFileService.deleteFile(fileUrl);
  successResponse(res, {
    message: "File deleted successfully!",
    data: result,
  });
});

export const uploadFileController = { uploadFile, deleteFile };