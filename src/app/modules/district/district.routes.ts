import { Router } from "express";
import authVerify from "../../middlewares/authVerify";
import { userRoles } from "../../constants/global.constant";
import districtController from "./district.controller";
import { handleZodValidation } from "../../middlewares/handleZodValidation";
import { DistrictValidationSchema, updateDistrictValidationSchema } from "./district.validation";
import { upload } from "../../utils/multerS3Uploader";

const router = Router();

router.post("/", authVerify([userRoles.admin]), upload.single("logo"), handleZodValidation(DistrictValidationSchema, true), districtController.createDistrict)

router.get("/", authVerify([userRoles.admin, userRoles.principal, userRoles.teacher]), districtController.getDistricts)

router.put("/:id", authVerify([userRoles.admin]), upload.single("logo"), handleZodValidation(updateDistrictValidationSchema, true), districtController.updateDistrict)

router.delete("/:id", authVerify([userRoles.admin]), districtController.deleteDistrict)

export default router;