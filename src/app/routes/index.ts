import { Router } from "express";
import authRouters from "../modules/auth/auth.routes";
import adminRouters from "../modules/admin/admin.routes";
import { settingsRoutes } from "../modules/settings/settings.routes";
import notificationRouters from "../modules/notification/notification.routes";
import { uploadFileRoutes } from "../modules/uploadFile/uploadFile.routes";
import districtRoutes from "../modules/district/district.routes";
import schoolRoutes from "../modules/school/school.routes";

const router = Router();

const apiRoutes = [
  { path: "/auth", route: authRouters },
  { path: "/admins", route: adminRouters },
  { path: "/districts", route: districtRoutes },
  { path: "/schools", route: schoolRoutes },

  { path: "/settings", route: settingsRoutes },
  { path: "/notifications", route: notificationRouters },
  { path: "/upload-files", route: uploadFileRoutes },
];

apiRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;