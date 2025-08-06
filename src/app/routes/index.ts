import { Router } from "express";
import authRouters from "../modules/auth/auth.routes";
import adminRouters from "../modules/admin/admin.routes";
import { legalRoutes } from "../modules/legal/legal.routes";
import notificationRouters from "../modules/notification/notification.routes";
import { uploadFileRoutes } from "../modules/uploadFile/uploadFile.routes";
import districtRoutes from "../modules/district/district.routes";
import schoolRoutes from "../modules/school/school.routes";
import categoryRoutes from "../modules/category/category.routes";
import principalRoutes from "../modules/principal/principal.routes";
import teacherRoutes from "../modules/teacher/teacher.routes";
import assetRoutes from "../modules/asset/asset.routes";
import chatRoutes from "../modules/chat/chat.routes";
import messageRoutes from "../modules/message/message.routes";
import summaryRouters from "../modules/summary/summary.routes";

const router = Router();

const apiRoutes = [
  { path: "/auth", route: authRouters },
  { path: "/admins", route: adminRouters },
  { path: "/districts", route: districtRoutes },
  { path: "/schools", route: schoolRoutes },
  { path: "/categories", route: categoryRoutes },
  { path: "/principals", route: principalRoutes },
  { path: "/teachers", route: teacherRoutes },
  { path: "/assets", route: assetRoutes },
  { path: "/chats", route: chatRoutes },
  { path: "/messages", route: messageRoutes },
  { path: "/legal", route: legalRoutes },
  { path: "/notifications", route: notificationRouters },
  { path: "/upload-files", route: uploadFileRoutes },
  { path: "/summary", route: summaryRouters },
];

apiRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;