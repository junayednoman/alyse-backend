import { AppError } from "../../classes/appError";
import Auth from "./auth.model";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import jsonwebtoken, { JwtPayload } from "jsonwebtoken";
import config from "../../config";
import generateOTP from "../../utils/generateOTP";
import { sendEmail } from "../../utils/sendEmail";
import isUserExist from "../../utils/isUserExist";
import fs from "fs";

const loginUser = async (payload: { email: string; password: string, is_remember: boolean }) => {
  const user = await isUserExist(payload.email);

  if (!user.is_account_verified) throw new AppError(400, "Please, verify your account before logging in!");

  // Compare the password
  const isPasswordMatch = await bcrypt.compare(payload.password, user.password);
  if (!isPasswordMatch) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Incorrect password!",
      "password"
    );
  }

  // generate token
  const jwtPayload = {
    email: user.email,
    role: user.role,
    id: user._id,
  };

  const accessToken = jsonwebtoken.sign(jwtPayload, config.jwt_access_secret as string, {
    expiresIn: config.jwt_access_expiration,
  });

  const refreshToken = jsonwebtoken.sign(jwtPayload, config.jwt_refresh_secret as string, {
    expiresIn: payload?.is_remember ? "60d" : "20d",
  });
  return { accessToken, refreshToken, role: user.role };
};

const sendOtp = async (payload: { email: string }) => {
  const user = await isUserExist(payload.email);

  // generate OTP and send email
  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(
    otp.toString(),
    Number(config.salt_rounds)
  );
  const otp_expires = new Date(Date.now() + 3 * 60 * 1000);
  const subject = `Your OTP Code is Here - Site FLow`;
  const year = new Date().getFullYear().toString();
  const emailTemplatePath = "./src/app/emailTemplates/otp.html";
  fs.readFile(emailTemplatePath, "utf8", (err, data) => {
    if (err) throw new AppError(500, err.message || "Something went wrong");
    const emailContent = data
      .replace('{{otp}}', otp.toString())
      .replace('{{year}}', year);

    sendEmail(payload.email, subject, emailContent);
  })

  await Auth.findByIdAndUpdate(
    user._id,
    { otp: hashedOtp, otp_expires, otp_attempts: 0 },
    { new: true }
  );
  return { otp };
};

const verifyOtp = async (payload: {
  email: string;
  otp: string;
  verify_account?: boolean;
}) => {
  const user = await isUserExist(payload.email);

  // check OTP attempts
  if (user.otp_attempts! > 3) {
    throw new AppError(StatusCodes.BAD_REQUEST, "OTP attempts exceeded", "otp");
  }

  user.otp_attempts = user.otp_attempts ? user.otp_attempts! + 1 : 1;
  user.save();

  if (!user.otp) {
    throw new AppError(StatusCodes.BAD_REQUEST, "OTP not found", "otp");
  }

  // verify OTP
  const isOtpMatch = await bcrypt.compare(payload.otp, user.otp as string);
  if (!isOtpMatch) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid OTP", "otp");
  }

  if (user.otp_expires! < new Date()) {
    throw new AppError(StatusCodes.BAD_REQUEST, "OTP has expired", "otp");
  }

  if (payload.verify_account) {
    const subject = `Your Email Has Been Successfully Verified - Site FLow`;
    const year = new Date().getFullYear().toString();
    const emailTemplatePath = "./src/app/emailTemplates/otpSuccess.html";
    fs.readFile(emailTemplatePath, "utf8", (err, data) => {
      if (err) throw new AppError(500, err.message || "Something went wrong");
      const emailContent = data
        .replace('{{year}}', year);

      sendEmail(payload.email, subject, emailContent);
    })

    return await Auth.findByIdAndUpdate(user._id, {
      is_account_verified: true,
      $unset: { otp: "", otp_expires: "", otp_attempts: "" },
    });
  }
  await Auth.findByIdAndUpdate(user._id, {
    is_otp_verified: true,
    $unset: { otp: "", otp_expires: "", otp_attempts: "" },
  });
};

const resetForgottenPassword = async (payload: {
  email: string;
  password: string;
}) => {
  const user = await isUserExist(payload.email);

  if (!user.is_otp_verified) {
    throw new AppError(StatusCodes.BAD_REQUEST, "OTP not verified", "otp");
  }

  // hash the password and save the document
  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.salt_rounds)
  );
  const newAuth = await Auth.findByIdAndUpdate(user._id, {
    password: hashedPassword,
    $unset: { is_otp_verified: "" },
  });

  if (newAuth) {
    const subject = `Your Password Has Been Successfully Reset - Site FLow`;
    const year = new Date().getFullYear().toString();
    const emailTemplatePath = "./src/app/emailTemplates/passwordResetSuccess.html";
    fs.readFile(emailTemplatePath, "utf8", (err, data) => {
      if (err) throw new AppError(500, err.message || "Something went wrong");
      const emailContent = data
        .replace('{{year}}', year);
      sendEmail(payload.email, subject, emailContent);
    })
  }
};

const changePassword = async (email: string, payload: {
  old_password: string;
  new_password: string;
}) => {
  const user = await isUserExist(email);

  // Compare the password
  const isPasswordMatch = await bcrypt.compare(
    payload.old_password,
    user.password
  );
  if (!isPasswordMatch) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Incorrect old password!",
      "password"
    );
  }

  // hash the new password and save the document
  const hashedPassword = await bcrypt.hash(
    payload.new_password,
    Number(config.salt_rounds)
  );
  await Auth.findByIdAndUpdate(user._id, { password: hashedPassword });

  // generate token
  const jwtPayload = {
    email: user.email,
    role: user.role,
    id: user._id,
  };

  const accessToken = jsonwebtoken.sign(jwtPayload, config.jwt_access_secret as string, {
    expiresIn: config.jwt_access_expiration,
  });

  const refreshToken = jsonwebtoken.sign(jwtPayload, config.jwt_refresh_secret as string, {
    expiresIn: "3d",
  });
  return { accessToken, refreshToken, role: user.role };
};

const getNewAccessToken = async (token: string) => {
  // verify token
  const decoded = jsonwebtoken.verify(token, config.jwt_refresh_secret as string) as JwtPayload
  const user = await Auth.findOne({ email: decoded.email, is_deleted: false, is_blocked: false });

  if (!user) {
    throw new AppError(404, "User not found!")
  }

  // generate token
  const jwtPayload = {
    email: user.email,
    role: user.role,
    id: user._id,
  };
  const accessToken = jsonwebtoken.sign(jwtPayload, config.jwt_access_secret as string, { expiresIn: config.jwt_access_expiration });
  return { accessToken }
}

const changeUserStatus = async (id: string) => {
  const user = await Auth.findById(id);
  if (!user) throw new AppError(400, "Invalid user id!");

  return await Auth.findByIdAndUpdate(user._id, { is_blocked: user.is_blocked ? false : true }, { new: true });
};

const AuthServices = {
  loginUser,
  sendOtp,
  verifyOtp,
  resetForgottenPassword,
  changePassword,
  getNewAccessToken,
  changeUserStatus,
};

export default AuthServices;
