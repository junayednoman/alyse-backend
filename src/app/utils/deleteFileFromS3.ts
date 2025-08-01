import {
  S3Client,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import config from "../config";

// Initialize S3 Client
const s3 = new S3Client({
  credentials: {
    accessKeyId: config.aws_access_key_id as string,
    secretAccessKey: config.aws_secret_access_key as string,
  },
  region: config.aws_region as string,
});

/**
 * Deletes a single image from AWS S3.
 * @param fileKey - The key of the file to delete (e.g., "folder/image.jpg").
 * @throws Will throw an error if the deletion fails.
 */
export const deleteFileFromS3 = async (
  fileLocation: string
): Promise<void> => {
  const fileKey = fileLocation.split(".amazonaws.com/")[1];
  try {
    const params = {
      Bucket: config.aws_s3_bucket_name as string, // Your bucket name
      Key: fileKey, // File key
    };

    const command = new DeleteObjectCommand(params);
    await s3.send(command);
  } catch (error: any) {
    console.error(`Error deleting file: ${error.message}`);
  }
};

/**
 * Deletes multiple images from AWS S3.
 * @param fileKeys - An array of keys for the files to delete (e.g., ["folder/image1.jpg", "folder/image2.jpg"]).
 * @throws Will throw an error if the deletion fails.
 */
export const deleteMultipleFilesFromS3 = async (
  fileKeys: string[]
): Promise<void> => {
  try {
    if (fileKeys.length === 0) {
      throw new Error("No file keys provided for deletion");
    }

    const params = {
      Bucket: config.aws_s3_bucket_name as string, // Your bucket name
      Delete: {
        Objects: fileKeys.map((key) => ({ Key: key })), // Convert file keys to the required format
        Quiet: false, // Set to true if you don't need response for each deleted object
      },
    };

    const command = new DeleteObjectsCommand(params);
    const result = await s3.send(command);

    console.log("Deleted files:", result.Deleted); // Log successfully deleted files
    if (result.Errors && result.Errors.length > 0) {
      console.error("Failed to delete files:", result.Errors); // Log any errors
    }
  } catch (error: any) {
    console.error(`Error deleting files: ${error.message}`);
  }
};
