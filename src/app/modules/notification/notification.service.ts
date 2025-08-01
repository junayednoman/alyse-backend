import { ObjectId } from "mongoose";
import Notification from "./notification.model";
import generateOTP from "../../utils/generateOTP";
import QueryBuilder from "../../classes/queryBuilder";

const createNotification = async (id: string) => {
  const otp = generateOTP()
  const notificationData = {
    receiver: id as unknown as ObjectId,
    title: `New Notification-${otp}`,
    body: 'You have a new notification',
  }
  const result = await Notification.create(notificationData);
  return result;
}

const getAllNotifications = async (query: Record<string, any>, id: string) => {
  const searchableFields = [
    "title",];
  const userQuery = new QueryBuilder(
    Notification.find({ receiver: id }),
    query
  )
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .selectFields();

  const meta = await userQuery.countTotal();
  const result = await userQuery.queryModel;

  return { data: result, meta };
}

const markAllAsRead = async (id: string) => {
  const result = await Notification.updateMany({ hasRead: false, receiver: id }, { hasRead: true });
  return result;
}

const getUnreadNotificationCount = async (id: string) => {
  const result = await Notification.countDocuments({ hasRead: false, receiver: id });
  return result;
}

const deleteSingleNotification = async (id: string) => {
  const result = await Notification.findByIdAndDelete(id);
  return result;
}

const deleteMyNotifications = async (id: string) => {
  const result = await Notification.deleteMany({ receiver: id });
  return result;
}

export const notificationServices = { getAllNotifications, markAllAsRead, createNotification, getUnreadNotificationCount, deleteSingleNotification, deleteMyNotifications };