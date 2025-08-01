import { Router } from "express";
import { userRoles } from "../../constants/global.constant";
import authVerify from "../../middlewares/authVerify";
import { handleZodValidation } from "../../middlewares/handleZodValidation";
import { PrincipalValidationSchema, UpdatePrincipalValidationSchema } from "./principal.validation";
import principalController from "./principal.controller";
import { upload } from "../../utils/multerS3Uploader";

const router = Router();

router.post(
  "/",
  authVerify([userRoles.admin]),
  handleZodValidation(PrincipalValidationSchema),
  principalController.addPrincipal
);

router.get(
  "/",
  authVerify([userRoles.admin]),
  principalController.getAllPrincipals
);

router.get(
  "/profile",
  authVerify([userRoles.principal]),
  principalController.getPrincipalProfile
);

router.get(
  "/:id",
  authVerify([userRoles.admin]),
  principalController.getPrincipalById
);

router.put(
  "/",
  authVerify([userRoles.principal]),
  handleZodValidation(UpdatePrincipalValidationSchema),
  principalController.updatePrincipalProfile
);

router.patch(
  "/change-image",
  authVerify([userRoles.principal]),
  upload.single("image"),
  principalController.updatePrincipalImage
);

router.patch(
  "/:id",
  authVerify([userRoles.admin]),
  principalController.changePrincipalStatus
);

export default router;