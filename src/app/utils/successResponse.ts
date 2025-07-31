import { Response } from "express"

export const successResponse = (res: Response, { message, data, status }: { message: string, data?: any, status?: number, }) => {
    return res.status(status || 200).json({
        success: true,
        message: message,
        data
    })
}