import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { successResponse } from "../../utils/successResponse";
import { notificationServices } from "./notification.service";

const createNotification = handleAsyncRequest(
  async (req: any, res) => {
    const id = req?.user.id;
    const result = await notificationServices.createNotification(id);
    successResponse((res), {
      message: "Notifications created successfully!",
      data: result
    })
  }
)

const getAllNotifications = handleAsyncRequest(
  async (req: any, res) => {
    const query = req.query;
    const id = req.user.id;
    const result = await notificationServices.getAllNotifications(query, id);
    successResponse((res), {
      message: "Notifications retrieved successfully!",
      data: result
    })
  }
)

const markAllAsRead = handleAsyncRequest(
  async (req: any, res) => {
    const id = req.user.id;
    const result = await notificationServices.markAllAsRead(id);
    successResponse((res), {
      message: "All notification marked as read successfully!",
      data: result
    })
  }
)

const getUnreadNotificationCount = handleAsyncRequest(
  async (req: any, res) => {
    const id = req.user.id;
    const result = await notificationServices.getUnreadNotificationCount(id);
    successResponse((res), {
      message: "Unread notification count retrieved successfully!",
      data: result
    })
  }
)

const deleteSingleNotification = handleAsyncRequest(
  async (req: any, res) => {
    const id = req.params.id;
    const result = await notificationServices.deleteSingleNotification(id);
    successResponse((res), {
      message: "Notification deleted successfully!",
      data: result
    })
  }
)

const deleteMyNotifications = handleAsyncRequest(
  async (req: any, res) => {
    const id = req.user.id;
    const result = await notificationServices.deleteMyNotifications(id);
    successResponse((res), {
      message: "Notifications deleted successfully!",
      data: result
    })
  }
)

export const notificationController = {
  getAllNotifications,
  markAllAsRead,
  createNotification,
  getUnreadNotificationCount,
  deleteSingleNotification,
  deleteMyNotifications
}