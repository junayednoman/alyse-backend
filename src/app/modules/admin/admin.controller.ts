import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { successResponse } from "../../utils/successResponse";
import { adminServices } from "./admin.service";

const getAdminProfile = handleAsyncRequest(async (req: any, res) => {
  const email = req.user.email
  const result = await adminServices.getAdminProfile(email);
  successResponse(res, {
    message: "Profile retrieved successfully!",
    data: result,
  });
});

const updateAdminProfile = handleAsyncRequest(async (req: any, res) => {
  const payload = req.body;
  const email = req.user.email;
  const result = await adminServices.updateAdminProfile(email, payload);
  successResponse(res, {
    message: "Profile updated successfully!",
    data: result,
  });
});

const updateAdminProfileImage = handleAsyncRequest(async (req: any, res) => {
  const image = req.file?.location;
  const email = req.user.email;
  const result = await adminServices.updateAdminProfileImage(email, image);
  successResponse(res, {
    message: "Profile image updated successfully!",
    data: result,
  });
});

const adminControllers = {
  updateAdminProfile,
  getAdminProfile,
  updateAdminProfileImage
};

export default adminControllers;
