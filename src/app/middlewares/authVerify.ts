import { NextFunction, Request, Response } from "express";
import { AppError } from "../classes/appError";
import verifyJWT from "../utils/verifyJWT";
import handleAsyncRequest from "../utils/handleAsyncRequest";
import Auth from "../modules/auth/auth.model";

const authVerify = (allowedRoles: string[]) =>
  handleAsyncRequest(
    async (req: Request, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new AppError(401, "Unauthorized");
      }
      const token = authHeader.split("Bearer ")[1];

      if (!token) throw new AppError(401, "Unauthorized");


      const decoded = verifyJWT(token);
      
      const user = await Auth.findOne({
        email: decoded.email,
        isDeleted: false,
        isBlocked: false,
      });

      if (!user) {
        throw new AppError(401, "Unauthorized");
      }

      if (user.role !== decoded.role || !allowedRoles.includes(decoded?.role)) {
        throw new AppError(403, "Forbidden");
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      req.user = decoded;

      next();
    }
  );

export default authVerify;
