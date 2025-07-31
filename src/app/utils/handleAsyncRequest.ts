import { NextFunction, Request, RequestHandler, Response } from "express";

// utility function to handle async requests
const handleAsyncRequest = (fn: RequestHandler) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(error => (next(error)));
    }
}
export default handleAsyncRequest