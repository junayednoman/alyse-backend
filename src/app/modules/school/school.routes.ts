import { Router } from "express";
import { userRoles } from "../../constants/global.constant";
import authVerify from "../../middlewares/authVerify";
import { handleZodValidation } from "../../middlewares/handleZodValidation";
import { SchoolValidationSchema } from "./school.validation";
import schoolController from "./school.controller";

const router = Router();

router.post(
  "/",
  authVerify([userRoles.admin]),
  handleZodValidation(SchoolValidationSchema),
  schoolController.createSchool
);

router.get(
  "/",
  authVerify([userRoles.admin]),
  schoolController.getAllSchools
);

router.get(
  "/:id",
  authVerify([userRoles.admin]),
  schoolController.getSchoolById
);

router.put(
  "/:id",
  authVerify([userRoles.admin]),
  handleZodValidation(SchoolValidationSchema),
  schoolController.updateSchool
);

router.delete(
  "/:id",
  authVerify([userRoles.admin]),
  schoolController.deleteSchool
);

export default router;