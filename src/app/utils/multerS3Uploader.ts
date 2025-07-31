import multer from "multer";
import AWS from 'aws-sdk';
import config from "../config";
import path from "path";
import fs from "fs";

export interface TFile {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  destination: string
  filename: string
  path: string
  size: number
}

export const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb: any) => {
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/jpg', 'image/webp', // Image types
      'video/mp4', 'video/webm', 'video/avi', 'video/mkv', 'video/mov',  // Video types
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: config.aws_access_key_id,
  secretAccessKey: config.aws_secret_access_key,
  region: config.aws_region,
});

export const uploadToS3 = async (file: TFile, folderName?: string) => {
  const localFilePath = path.join(process.cwd(), 'uploads', file.filename);
  const fileStream = fs.createReadStream(localFilePath);
  const params = {
    Bucket: config.aws_s3_bucket_name!,
    Key: `${folderName || 'images'}/${file.filename}/${file.originalname}`,
    Body: fileStream,
  };

  try {
    const data = await s3.upload(params).promise();

    return data.Location;
  } catch (err) {
    console.error('S3 Upload Error:', err);
    throw err;
  } finally {
    fs.unlinkSync(localFilePath);
  }
}

export const uploadMultipleToS3 = async (files: TFile[], folderName?: string) => {
  const uploadPromises = files.map((file) => {
    return uploadToS3(file, folderName);
  });

  try {
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (err) {
    console.error('One or more uploads failed:', err);
    throw err;
  }
};