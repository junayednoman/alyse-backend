// import admin from "firebase-admin";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../classes/appError";
import { TNotificationPayload } from "../modules/notification/notification.interface";
import NotificationModel from "../modules/notification/notification.model";
// import firebaseJsonFile from "../private/alyse-firebase.json";
// import firebaseJsonFile from "../private/expirydeals-48316-9bd60b4ed3b0.json";

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(firebaseJsonFile as admin.ServiceAccount),
//   });
// }

// export const sendNotification = async (
//   fcmToken: string[],
//   payload: TNotificationPayload,
// ): Promise<any> => {
//   console.log('payuload', payload);
//   try {
//     const response = await admin.messaging().sendEachForMulticast({
//       tokens: fcmToken,
//       notification: {
//         title: payload.title,
//         body: payload.body,
//       },
//       apns: {
//         headers: {
//           "apns-push-type": "alert",
//         },
//         payload: {
//           aps: {
//             badge: 1,
//             sound: "default",
//           },
//         },
//       },
//     });

//     console.log(response?.responses, "from send notification");

//     if (response.successCount) {
//       fcmToken?.map(async (token) => {
//         try {
//           if (token) {

//             await NotificationModel.create(payload);

//           } else {
//             console.log("Token not found");
//           }
//         } catch (error) {
//           console.log(error);
//         }
//       });
//     }

//     console.log("Response:", response.responses);

//     return response;
//   } catch (error: any) {
//     console.error("Error sending message:", error);
//     if (error?.code === "messaging/third-party-auth-error") {
//       return null;
//     } else {
//       console.error("Error sending message:", error);
//       throw new AppError(
//         StatusCodes.NOT_IMPLEMENTED,
//         error.message || "Failed to send notification",
//       );
//     }
//   }
// };

export const sendNotification = async (payload: TNotificationPayload) => {
  try {
    await NotificationModel.create(payload);
  } catch (error: any) {
    throw new AppError(
      StatusCodes.NOT_IMPLEMENTED,
      error.message || "Failed to send notification"
    );
  }
};

// export const firebaseAdmin = admin;
