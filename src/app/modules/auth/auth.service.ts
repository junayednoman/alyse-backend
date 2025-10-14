import { AppError } from "../../classes/appError";
import Auth from "./auth.model";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import jsonwebtoken, { JwtPayload, Secret } from "jsonwebtoken";
import config from "../../config";
import generateOTP from "../../utils/generateOTP";
import { sendEmail } from "../../utils/sendEmail";
import isUserExist from "../../utils/isUserExist";
import fs from "fs";
import { ISocialLogin, TLoginUser } from "./auth.validation";
import { userRoles } from "../../constants/global.constant";
import { startSession } from "mongoose";
import Teacher from "../teacher/teacher.model";
import { District } from "../district/district.model";
import School from "../school/school.model";

const loginUser = async (payload: TLoginUser) => {
  const user = await isUserExist(payload.email);

  if (!user.isAccountVerified)
    throw new AppError(400, "Verify your account before logging in!");
  if (user.needsPasswordChange)
    throw new AppError(400, "Change your password before logging in!");
  if (user.provider === "google")
    throw new AppError(400, "Your account created using Google!");

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

  const accessToken = jsonwebtoken.sign(
    jwtPayload,
    config.jwt_access_secret as string,
    {
      expiresIn: payload.isMobileApp ? "60d" : "12h",
    }
  );

  const refreshToken = jsonwebtoken.sign(
    jwtPayload,
    config.jwt_refresh_secret as string,
    {
      expiresIn: "60d",
    }
  );
  return { accessToken, refreshToken, role: user.role };
};

const socialLogin = async (payload: ISocialLogin) => {
  // const decodedToken: DecodedIdToken | null = await firebaseAdmin
  //   .auth()
  //   .verifyIdToken(idToken);
  // console.log("fcmToken", fcmToken);
  // if (!decodedToken) throw new AppError(400, "login failed!");

  const auth = await Auth.findOne({
    email: payload.email,
    isAccountVerified: true,
  });

  // generate token
  const jwtPayload = {
    email: payload.email,
    role: userRoles.teacher,
  } as any;

  if (auth) {
    if (auth?.provider !== payload.provider)
      throw new AppError(
        400,
        `Your account was set up with ${auth.provider}! Use ${auth.provider} to log in.`
      );

    jwtPayload.id = auth._id;
    if (payload.fcmToken) {
      await Auth.findByIdAndUpdate(auth._id, { fcmToken: payload.fcmToken });
    }
  } else {
    const session = await startSession();
    try {
      session.startTransaction();
      const district = await District.findById(payload.district);
      if (!district) throw new AppError(400, "Invalid district ID!");

      const school = await School.findById(payload.school);
      if (!school) throw new AppError(400, "Invalid school ID!");

      const teacherData = {
        name: payload.name,
        image: payload.image,
        email: payload.email,
        district: payload.district,
        school: payload.school,
      };

      const authData = {
        email: payload.email,
        role: userRoles.teacher,
        isAccountVerified: true,
        fcmToken: payload.fcmToken,
        provider: payload.provider,
      } as any;

      const user = await Teacher.create(teacherData);
      authData.user = user._id;

      const newAuth = await Auth.create(authData);
      jwtPayload.id = newAuth._id;
      await session.commitTransaction();
    } catch (error: any) {
      await session.abortTransaction();
      throw new AppError(500, error.message || "Error creating moderator!");
    } finally {
      await session.endSession();
    }
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const accessToken = jsonwebtoken.sign(
    jwtPayload,
    config.jwt_access_secret as string,
    {
      expiresIn: config.jwt_refresh_expiration,
    }
  );

  return { accessToken };
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
  const subject = `Your OTP Code is Here - D.A.M`;
  const year = new Date().getFullYear().toString();
  const emailTemplatePath = "./src/app/emailTemplates/otp.html";
  fs.readFile(emailTemplatePath, "utf8", (err, data) => {
    if (err) throw new AppError(500, err.message || "Something went wrong");
    const emailContent = data
      .replace("{{otp}}", otp.toString())
      .replace("{{year}}", year);

    sendEmail(payload.email, subject, emailContent);
  });

  await Auth.findByIdAndUpdate(
    user._id,
    { otp: hashedOtp, otpExpires, otpAttempts: 0 },
    { new: true }
  );
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
    const subject = `Your Email Has Been Successfully Verified - D.A.M`;
    const year = new Date().getFullYear().toString();
    const emailTemplatePath = "./src/app/emailTemplates/otpSuccess.html";
    fs.readFile(emailTemplatePath, "utf8", (err, data) => {
      if (err) throw new AppError(500, err.message || "Something went wrong");
      const emailContent = data.replace("{{year}}", year);

      sendEmail(payload.email, subject, emailContent);
    });

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
    const subject = `Your Password Has Been Successfully Reset - D.A.M`;
    const year = new Date().getFullYear().toString();
    const emailTemplatePath =
      "./src/app/emailTemplates/passwordResetSuccess.html";
    fs.readFile(emailTemplatePath, "utf8", (err, data) => {
      if (err) throw new AppError(500, err.message || "Something went wrong");
      const emailContent = data.replace("{{year}}", year);
      sendEmail(payload.email, subject, emailContent);
    });
  }
};

const changePassword = async (
  email: string,
  payload: {
    oldPassword: string;
    newPassword: string;
  }
) => {
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

  const accessToken = jsonwebtoken.sign(
    jwtPayload,
    config.jwt_access_secret as Secret,
    {
      expiresIn: "12h",
    }
  );

  const refreshToken = jsonwebtoken.sign(
    jwtPayload,
    config.jwt_refresh_secret as string,
    {
      expiresIn: "30d",
    }
  );
  return { accessToken, refreshToken, role: user.role };
};

const getNewAccessToken = async (token: string) => {
  // verify token
  const decoded = jsonwebtoken.verify(
    token,
    config.jwt_refresh_secret as string
  ) as JwtPayload;
  const user = await Auth.findOne({
    email: decoded.email,
    isDeleted: false,
    isBlocked: false,
  });

  if (!user) {
    throw new AppError(404, "User not found!");
  }

  // generate token
  const jwtPayload = {
    email: user.email,
    role: user.role,
    id: user._id,
  };
  const accessToken = jsonwebtoken.sign(
    jwtPayload,
    config.jwt_access_secret as string,
    { expiresIn: "12h" }
  );
  return { accessToken };
};

const changeUserStatus = async (id: string) => {
  const user = await Auth.findById(id);
  if (!user) throw new AppError(400, "Invalid user id!");

  return await Auth.findByIdAndUpdate(
    user._id,
    { isBlocked: user.isBlocked ? false : true },
    { new: true }
  );
};

const AuthServices = {
  loginUser,
  sendOtp,
  verifyOtp,
  resetForgottenPassword,
  changePassword,
  getNewAccessToken,
  changeUserStatus,
  socialLogin,
};

export default AuthServices;
