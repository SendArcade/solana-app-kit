// File: server/src/utils/gcs.ts
import { Storage } from '@google-cloud/storage';

const bucketName = process.env.GCS_BUCKET_NAME;
if (!bucketName) {
  throw new Error('Missing GCS_BUCKET_NAME in environment variables');
}

// Initialize Storage client using Application Default Credentials
// (User ADC must have at least Storage Object Admin or so.)
const storage = new Storage();
const bucket = storage.bucket(bucketName);

/**
 * Upload a file buffer to GCS and return a static object URL.
 * 
 * Because uniform bucket-level access is enabled, 
 * we do NOT call file.makePublic().
 * 
 * @param filePath   e.g. "uploads/profiles/<userId>-<timestamp>"
 * @param fileBuffer The file buffer (from multer or any source)
 * @param mimeType   The file's MIME type (e.g., "image/jpeg")
 * @returns A static GCS URL: https://storage.googleapis.com/<bucketName>/<filePath>
 */
export async function uploadFileToGCS(
  filePath: string,
  fileBuffer: Buffer,
  mimeType: string,
): Promise<string> {
  const file = bucket.file(filePath);

  // Just save the file. No ACL changes, no makePublic() calls.
  await file.save(fileBuffer, {
    metadata: { contentType: mimeType },
    resumable: false,
  });

  // Return static URL. Bucket-level IAM must allow "allUsers => Storage Object Viewer".
  return `https://storage.googleapis.com/${bucketName}/${filePath}`;
}
