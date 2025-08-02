import { Router } from "express";
import { userRoles } from "../../constants/global.constant";
import authVerify from "../../middlewares/authVerify";
import { handleZodValidation } from "../../middlewares/handleZodValidation";
import { TeacherValidationSchema, UpdateTeacherValidationSchema } from "./teacher.validation";
import teacherController from "./teacher.controller";
import { upload } from "../../utils/multerS3Uploader";

const router = Router();

router.post(
  "/signup",
  upload.single("image"),
  handleZodValidation(TeacherValidationSchema, true),
  teacherController.teacherSignup
);

router.get(
  "/",
  authVerify([userRoles.admin]),
  teacherController.getAllTeachers
);

router.get(
  "/district/:districtId",
  authVerify([userRoles.admin, userRoles.principal]),
  teacherController.getTeachersByDistrictId
);

router.get(
  "/profile",
  authVerify([userRoles.teacher]),
  teacherController.getTeacherProfile
);

router.put(
  "/profile",
  authVerify([userRoles.teacher]),
  handleZodValidation(UpdateTeacherValidationSchema),
  teacherController.updateTeacherProfile
);

router.patch(
  "/profile/change-image",
  authVerify([userRoles.teacher]),
  upload.single("image"),
  teacherController.updateTeacherProfileImage
);

export default router;