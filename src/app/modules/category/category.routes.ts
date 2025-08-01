import { Router } from "express";
import { userRoles } from "../../constants/global.constant";
import authVerify from "../../middlewares/authVerify";
import { handleZodValidation } from "../../middlewares/handleZodValidation";
import { CategoryValidationSchema } from "./category.validation";
import categoryController from "./category.controller";

const router = Router();

router.post(
  "/",
  authVerify([userRoles.admin]),
  handleZodValidation(CategoryValidationSchema),
  categoryController.createCategory
);

router.get(
  "/",
  authVerify([userRoles.admin, userRoles.teacher]),
  categoryController.getAllCategories
);

router.put(
  "/:id",
  authVerify([userRoles.admin]),
  handleZodValidation(CategoryValidationSchema),
  categoryController.updateCategory
);

router.delete(
  "/:id",
  authVerify([userRoles.admin]),
  categoryController.deleteCategory
);

export default router;