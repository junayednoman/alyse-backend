import { Router } from "express";
import { userRoles } from "../../constants/global.constant";
import authVerify from "../../middlewares/authVerify";
import { handleZodValidation } from "../../middlewares/handleZodValidation";
import { ChatValidationSchema } from "./chat.validation";
import chatController from "./chat.controller";

const router = Router();

router.post(
  "/",
  authVerify([userRoles.teacher, userRoles.admin]),
  handleZodValidation(ChatValidationSchema),
  chatController.createChat
);

router.get(
  "/my",
  authVerify([userRoles.teacher, userRoles.admin]),
  chatController.getMyChats
);

router.delete(
  "/:id",
  authVerify([userRoles.teacher, userRoles.admin]),
  chatController.deleteChat
);

const chatRouters = router;

export default chatRouters;