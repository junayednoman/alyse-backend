import { AppError } from "../classes/appError";
import handleAsyncRequest from "../utils/handleAsyncRequest";

export const parseBody = handleAsyncRequest(async (req, res, next) => {
  console.log("Raw Request Body:", req.body);

  if (!req?.body?.data) {
    throw new AppError(400, "Please provide data in the body under data key");
  }
  req.body = JSON.parse(req?.body?.payload);

  next();
});
