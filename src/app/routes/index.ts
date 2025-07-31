import { Router } from "express";
import authRouters from "../modules/auth/auth.routes";
import adminRouters from "../modules/admin/admin.routes";
import { settingsRoutes } from "../modules/settings/settings.routes";
import notificationRouters from "../modules/notification/notification.routes";
import { uploadFileRoutes } from "../modules/uploadFile/uploadFile.routes";

const router = Router();

const apiRoutes = [
  { path: "/auth", route: authRouters },
  { path: "/admins", route: adminRouters },
  { path: "/settings", route: settingsRoutes },
  { path: "/notifications", route: notificationRouters },
  { path: "/upload-files", route: uploadFileRoutes },
];

apiRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;