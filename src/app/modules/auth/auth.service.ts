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
import path from "path";

const loginUser = async (payload: { email: string; password: string, isRemember: boolean }) => {
  const folderPath = 'uploads';
  const files = fs.readdirSync(folderPath);

  if (files.length > 0) {
    files.forEach(file => {
      const filePath = path.join(folderPath, file);
      if (fs.lstatSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      }
    });
  }

  const user = await isUserExist(payload.email);

  if (!user.isAccountVerified) throw new AppError(400, "Please, verify your account before logging in!");

  if (user.needsPasswordChange) throw new AppError(400, "Please, change your password before logging in!");

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
    expiresIn: payload?.isRemember ? "60d" : "20d",
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
  const otpExpires = new Date(Date.now() + 3 * 60 * 1000);
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
    { otp: hashedOtp, otpExpires, otpAttempts: 0 },
    { new: true }
  );
  return { otp };
};

const verifyOtp = async (payload: {
  email: string;
  otp: string;
  verifyAccount?: boolean;
}) => {
  const user = await isUserExist(payload.email);

  // check OTP attempts
  if (user.otpAttempts! > 3) {
    throw new AppError(StatusCodes.BAD_REQUEST, "OTP attempts exceeded", "otp");
  }

  user.otpAttempts = user.otpAttempts ? user.otpAttempts! + 1 : 1;
  user.save();

  if (!user.otp) {
    throw new AppError(StatusCodes.BAD_REQUEST, "OTP not found", "otp");
  }

  // verify OTP
  const isOtpMatch = await bcrypt.compare(payload.otp, user.otp as string);
  if (!isOtpMatch) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid OTP", "otp");
  }

  if (user.otpExpires! < new Date()) {
    throw new AppError(StatusCodes.BAD_REQUEST, "OTP has expired", "otp");
  }

  if (payload.verifyAccount) {
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
      isAccountVerified: true,
      $unset: { otp: "", otpExpires: "", otpAttempts: "" },
    });
  }
  await Auth.findByIdAndUpdate(user._id, {
    isOtpVerified: true,
    $unset: { otp: "", otpExpires: "", otpAttempts: "" },
  });
};

const resetForgottenPassword = async (payload: {
  email: string;
  password: string;
}) => {
  const user = await isUserExist(payload.email);

  if (!user.isOtpVerified) {
    throw new AppError(StatusCodes.BAD_REQUEST, "OTP not verified", "otp");
  }

  // hash the password and save the document
  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.salt_rounds)
  );
  const newAuth = await Auth.findByIdAndUpdate(user._id, {
    password: hashedPassword,
    needsPasswordChange: false,
    $unset: { isOtpVerified: "" },
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
  oldPassword: string;
  newPassword: string;
}) => {
  const user = await isUserExist(email);

  // Compare the password
  const isPasswordMatch = await bcrypt.compare(
    payload.oldPassword,
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
    payload.newPassword,
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
  const user = await Auth.findOne({ email: decoded.email, isDeleted: false, isBlocked: false });

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

  return await Auth.findByIdAndUpdate(user._id, { isBlocked: user.isBlocked ? false : true }, { new: true });
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
