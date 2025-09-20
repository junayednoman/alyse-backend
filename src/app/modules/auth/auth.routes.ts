import { Router } from "express";
import { handleZodValidation } from "../../middlewares/handleZodValidation";
import {
  changePasswordValidationSchema,
  emailValidationSchema,
  googleLoginValidationSchema,
  loginUserValidationSchema,
  resetForgottenPasswordSchema,
  verifyOtpSchema,
} from "./auth.validation";
import AuthController from "./auth.controller";
import authVerify from "../../middlewares/authVerify";
import { userRoles } from "../../constants/global.constant";

const authRouters = Router();

authRouters.post(
  "/login",
  handleZodValidation(loginUserValidationSchema),
  AuthController.loginUser
);
authRouters.post(
  "/google-login",
  handleZodValidation(googleLoginValidationSchema),
  AuthController.googleLogin
);
authRouters.post(
  "/logout",
  authVerify([userRoles.admin, userRoles.principal, userRoles.teacher]),
  AuthController.logOut
);
authRouters.post(
  "/send-otp",
  handleZodValidation(emailValidationSchema),
  AuthController.sendOtp
);
authRouters.post(
  "/verify-otp",
  handleZodValidation(verifyOtpSchema),
  AuthController.verifyOtp
);
authRouters.post(
  "/reset-forgotten-password",
  handleZodValidation(resetForgottenPasswordSchema),
  AuthController.resetForgottenPassword
);
authRouters.post(
  "/change-password",
  authVerify([userRoles.admin, userRoles.principal, userRoles.teacher,]),
  handleZodValidation(changePasswordValidationSchema),
  AuthController.changePassword
);
authRouters.get(
  "/refresh-token",
  AuthController.getNewAccessToken
);
authRouters.patch(
  "/change-status/:id",
  authVerify([userRoles.admin]),
  AuthController.changeUserStatus
)


export default authRouters;
