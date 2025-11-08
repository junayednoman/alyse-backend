import { Router } from "express";
import authVerify from "../../middlewares/authVerify";
import { userRoles } from "../../constants/global.constant";
import districtController from "./district.controller";
import { handleZodValidation } from "../../middlewares/handleZodValidation";
import {
  DistrictValidationSchema,
  updateDistrictValidationSchema,
  verifyCodeZod,
} from "./district.validation";
import { upload } from "../../utils/awss3";

const router = Router();

router.post(
  "/verify-code",
  handleZodValidation(verifyCodeZod),
  districtController.verifyCode
);

router.post(
  "/",
  authVerify([userRoles.admin]),
  upload.single("logo"),
  handleZodValidation(DistrictValidationSchema, true),
  districtController.createDistrict
);

router.get("/", districtController.getDistricts);

router.put(
  "/:id",
  authVerify([userRoles.admin]),
  upload.single("logo"),
  handleZodValidation(updateDistrictValidationSchema, true),
  districtController.updateDistrict
);
router.patch(
  "/:id",
  authVerify([userRoles.admin]),
  districtController.toggleDistrictBlock
);
router.delete(
  "/:id",
  authVerify([userRoles.admin]),
  districtController.deleteDistrict
);

export default router;
