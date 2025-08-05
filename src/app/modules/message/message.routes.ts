import { Router } from "express";
import { userRoles } from "../../constants/global.constant";
import authVerify from "../../middlewares/authVerify";
import { handleZodValidation } from "../../middlewares/handleZodValidation";
import { MessageValidationSchema } from "./message.validation";
import messageController from "./message.controller";

const router = Router();

router.post(
  "/",
  authVerify([userRoles.teacher]),
  handleZodValidation(MessageValidationSchema),
  messageController.createMessage
);

router.get(
  "/:chatId",
  authVerify([userRoles.teacher]),
  messageController.getMessagesByChatId
);

router.put(
  "/:id",
  authVerify([userRoles.teacher]),
  handleZodValidation(MessageValidationSchema.partial()),
  messageController.updateMessage
);

router.patch("/seen/:chatId", authVerify([userRoles.teacher]), messageController.markMessagesAsSeen);

router.delete(
  "/:id",
  authVerify([userRoles.teacher]),
  messageController.deleteMessage
);

const messageRoutes = router;

export default messageRoutes;