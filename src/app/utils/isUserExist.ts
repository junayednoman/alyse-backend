import { StatusCodes } from "http-status-codes";
import { AppError } from "../classes/appError";
import Auth from "../modules/auth/auth.model";

const isUserExist = async (email: string) => {
  // check if user exists
  const user = await Auth.findOne({
    email,
    isDeleted: false,
    isBlocked: false,
  });
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "Could not find user", "email");
  }
  return user;
};
export default isUserExist;
