import mongoose from 'mongoose';
import { TNotificationPayload } from './notification.interface';

const notificationSchema = new mongoose.Schema<TNotificationPayload>({
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  image: { type: String, default: null },
  link: { type: String },
  hasRead: { type: Boolean, default: false }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
