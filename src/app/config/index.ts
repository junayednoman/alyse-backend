import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join((process.cwd(), ".env")) });

export default {
  ip: process.env.IP,
  port: process.env.PORT,
  socket_port: process.env.SOCKET_PORT,
  admin_email: process.env.ADMIN_EMAIL,
  admin_password: process.env.ADMIN_PASSWORD,
  database_url: process.env.DATABASE_URL,
  node_env: process.env.NODE_ENV,
  salt_rounds: process.env.SALT_ROUNDS,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_access_expiration: process.env.JWT_ACCESS_EXPIRATION,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_refresh_expiration: process.env.JWT_REFRESH_EXPIRATION,
  smtp_host: process.env.SMTP_HOST,
  sender_email: process.env.SENDER_EMAIL,
  sender_app_pass: process.env.SENDER_APP_PASS,
  smtp_port: process.env.SMTP_PORT,
  stripe_secret_key: process.env.STRIPE_SECRET_KEY,
  stripe_webhook_secret_key: process.env.STRIPE_WEBHOOK_SECRET_KEY,
  origin: process.env.ORIGIN,
  aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
  aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
  aws_region: process.env.AWS_REGION,
  aws_s3_bucket_name: process.env.AWS_S3_BUCKET_NAME,
};
