export class AppError extends Error {
  public statusCode: number
  public path?: string;
  constructor(statusCode: number, message: string, path?: string) {
    super(message)
    this.statusCode = statusCode
    this.path = path
    Error.captureStackTrace(this, this.constructor)
  }
}
