import { Router } from "express";
import { userRoles } from "../../constants/global.constant";
import authVerify from "../../middlewares/authVerify";
import { handleZodValidation } from "../../middlewares/handleZodValidation";
import { AssetValidationSchema, deleteAssetImageValidationSchema } from "./asset.validation";
import assetController from "./asset.controller";
import { upload } from "../../utils/multerS3Uploader";

const router = Router();

router.post(
  "/",
  authVerify([userRoles.teacher]),
  upload.array("images"),
  handleZodValidation(AssetValidationSchema, true),
  assetController.createAsset
);

router.get(
  "/",
  authVerify([userRoles.teacher, userRoles.principal]),
  assetController.getAllAssets
);

router.get(
  "/my-posted",
  authVerify([userRoles.teacher]),
  assetController.getMyPostedAssets
);

router.get(
  "/my-grabbed",
  authVerify([userRoles.teacher]),
  assetController.getMyGrabbedAssets
);

router.patch(
  "/:id/grab",
  authVerify([userRoles.teacher]),
  assetController.grabAsset
);

router.put(
  "/:id",
  authVerify([userRoles.teacher]),
  upload.array("images"),
  handleZodValidation(AssetValidationSchema.partial(), true),
  assetController.updateAsset
);

router.delete(
  "/:id/image",
  authVerify([userRoles.teacher]),
  handleZodValidation(deleteAssetImageValidationSchema),
  assetController.deleteAssetImage
);

router.delete(
  "/:id",
  authVerify([userRoles.teacher]),
  assetController.deleteAsset
);

export default router;