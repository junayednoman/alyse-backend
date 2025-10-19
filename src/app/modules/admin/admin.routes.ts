import { Router } from "express";
import adminControllers from "./admin.controller";
import authVerify from "../../middlewares/authVerify";
import { handleZodValidation } from "../../middlewares/handleZodValidation";
import updateAdminProfileValidationSchema from "./admin.validation";
import { userRoles } from "../../constants/global.constant";
import { upload } from "../../utils/awss3";
const adminRouters = Router();

adminRouters.get(
  "/",
  authVerify([userRoles.admin, userRoles.principal]),
  adminControllers.getAdminProfile
);
adminRouters.put(
  "/",
  authVerify([userRoles.admin, userRoles.principal]),
  handleZodValidation(updateAdminProfileValidationSchema),
  adminControllers.updateAdminProfile
);
adminRouters.patch(
  "/image",
  authVerify([userRoles.admin, userRoles.principal]),
  upload.single("image"),
  adminControllers.updateAdminProfileImage
);
export default adminRouters;
