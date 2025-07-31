export type TErrorSources = {
  path: string | number;
  message: string;
}[];

export interface IJWTPayload {
  email: string;
  role: string;
  id: string;
  iat: number;
  exp: number;
}
