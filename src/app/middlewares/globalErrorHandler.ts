/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { ZodError, ZodIssue } from "zod";
import config from "../config";
import { Error } from "mongoose";
import { AppError } from "../classes/appError";
import { TErrorSources } from "../interfaces";

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let message = "Something went wrong!";
  let statusCode = 500;

  let errorSource: TErrorSources = [
    {
      path: "",
      message: "",
    },
  ];

  // check if the error is from zod validation
  if (err instanceof ZodError) {
    message = "Data validation error!";
    statusCode = 400;
    errorSource = err?.issues?.map((issue: ZodIssue) => ({
      path: issue?.path[issue?.path.length - 1],
      message: issue?.message,
    }));
  } else if (
    err instanceof Error.ValidationError ||
    err.name === "ValidationError"
  ) {
    // handle mongoose error
    const errorKeys = Object.keys(err.errors);
    const errorPaths =
      errorKeys.length > 1
        ? errorKeys.slice(0, -1).join(", ") +
          " & " +
          errorKeys[errorKeys.length - 1]
        : errorKeys[0];

    const errorValues = Object.values(err.errors);
    errorSource = errorValues.map((value) => ({
      // @ts-ignore
      path: value?.path,
      // @ts-ignore
      message: value?.message,
    }));
    statusCode = 400;
    message = errorPaths?.length
      ? `${errorPaths} is required!`
      : "Data validation error!";
  } else if (err?.name === "CastError" || err instanceof Error.CastError) {
    statusCode = 400;
    message = "Validation error!";
    errorSource = [
      {
        path: err.path,
        message: err.message,
      },
    ];
  } else if (err?.code === 11000) {
    statusCode = 409;
    const key = Object.keys(err?.keyValue)[0];
    const msg = err?.keyValue[key];
    message = `Invalid ${key}`;
    errorSource = [
      {
        path: "",
        message: `${msg} is already exist!`,
      },
    ];
  } else if (err instanceof AppError) {
    message = err?.message;
    statusCode = err?.statusCode;
    errorSource = [
      {
        path: "",
        message: err?.message,
      },
    ];
  } else if (err instanceof Error) {
    message = err?.message;
    errorSource = [
      {
        path: "",
        message: err?.message,
      },
    ];
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = err?.message;
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = err?.message;
  } else if (err.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = err?.message;
      errorSource = [
        {
          path: "",
          message: err?.message,
        },
      ];
    }
  }

  // ultimate error response
  res.status(statusCode).json({
    success: false,
    message,
    errorSource,
    err,
    stack: config.node_env === "development" && err?.stack,
  });
};
export default globalErrorHandler;
