import { Router } from "express";
import authVerify from "../../middlewares/authVerify";
import { notificationController } from "./notification.controller";
import { userRoles } from "../../constants/global.constant";

const notificationRouters = Router();

notificationRouters.post("/", authVerify([userRoles.admin, userRoles.companyAdmin, userRoles.employee]), notificationController.createNotification)
notificationRouters.get("/", authVerify([userRoles.admin, userRoles.companyAdmin, userRoles.employee]), notificationController.getAllNotifications)

notificationRouters.patch(
  "/mark-all-as-read", authVerify([userRoles.admin, userRoles.companyAdmin, userRoles.employee]),
  notificationController.markAllAsRead)

notificationRouters.get("/unread-count", authVerify([userRoles.admin, userRoles.companyAdmin, userRoles.employee]), notificationController.getUnreadNotificationCount)

notificationRouters.delete("/:id", authVerify([userRoles.admin, userRoles.companyAdmin, userRoles.employee]), notificationController.deleteSingleNotification)

notificationRouters.delete("/", authVerify([userRoles.admin, userRoles.companyAdmin, userRoles.employee]), notificationController.deleteMyNotifications)

export default notificationRouters;