import config from "../../config";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { successResponse } from "../../utils/successResponse";
import AuthServices from "./auth.service";

const loginUser = handleAsyncRequest(async (req, res) => {
  const payload = req.body;
  const result = await AuthServices.loginUser(payload);
  // set refreshToken in cookie
  const day = 24 * 60 * 60 * 1000
  const { refreshToken, accessToken } = result;
  const cookieOptions: any = {
    httpOnly: true,
    secure: config.node_env === 'production', // Use secure in production
    maxAge: payload.isRemember ? 60 * day : 20 * day,
  };

  if (config.node_env === 'production') cookieOptions.sameSite = 'none';

  res.cookie('constructionRefreshToken', refreshToken, cookieOptions);

  successResponse(res, {
    message: "User logged in successfully!",
    data: { accessToken },
  });
});

const logOut = handleAsyncRequest(async (req, res) => {
  const refreshToken = req?.cookies?.refreshToken;
  if (refreshToken) res.clearCookie('constructionRefreshToken');

  successResponse(res, {
    message: "User logged out successfully!",
  });
});

const sendOtp = handleAsyncRequest(async (req, res) => {
  const payload = req.body;
  const result = await AuthServices.sendOtp(payload);
  successResponse(res, {
    data: result,
    message: "OTP sent successfully!",
  });
});

const verifyOtp = handleAsyncRequest(async (req, res) => {
  const payload = req.body;
  await AuthServices.verifyOtp(payload);
  successResponse(res, {
    message: "OTP verified successfully!",
  });
});

const resetForgottenPassword = handleAsyncRequest(async (req, res) => {
  const payload = req.body;
  await AuthServices.resetForgottenPassword(payload);
  successResponse(res, {
    message: "Password reset successfully!",
  });
});

const changePassword = handleAsyncRequest(async (req: any, res) => {
  const payload = req.body;
  const email = req.user.email;
  const result = await AuthServices.changePassword(email, payload);

  // set refreshToken in cookie
  const day = 24 * 60 * 60 * 1000
  const { refreshToken, accessToken } = result;
  const cookieOptions: any = {
    httpOnly: true,
    secure: config.node_env === 'production', // Use secure in production
    maxAge: 3 * day,
  };

  if (config.node_env === 'production') cookieOptions.sameSite = 'none';

  res.cookie('refreshToken', refreshToken, cookieOptions);

  successResponse(res, {
    message: "New password created successfully!",
    data: { accessToken },
  });
});

const getNewAccessToken = handleAsyncRequest(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const result = await AuthServices.getNewAccessToken(refreshToken);
  successResponse(res, {
    message: "New access token retrieved successfully!",
    data: result,
  });
});

const changeUserStatus = handleAsyncRequest(async (req, res) => {
  const id = req.params.id;
  const result = await AuthServices.changeUserStatus(id);
  const refreshToken = req?.cookies?.refreshToken;
  if (refreshToken) res.clearCookie('constructionRefreshToken');
  successResponse(res, {
    message: "User account status changed successfully!",
    data: result,
  });
});

const AuthController = {
  loginUser,
  sendOtp,
  verifyOtp,
  resetForgottenPassword,
  changePassword,
  getNewAccessToken,
  logOut,
  changeUserStatus
};

export default AuthController;
