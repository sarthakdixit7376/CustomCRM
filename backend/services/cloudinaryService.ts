import { Readable } from 'stream';
import cloudinary from '../config/cloudinary.js';

export function uploadPdfBuffer(buffer: Buffer, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'lead-pricing-pdfs',
        public_id: publicId,
        format: 'pdf',
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary upload failed'));
          return;
        }
        resolve(result.secure_url);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}

/** Uploads a policy attachment (any file type) to Cloudinary, overwriting any existing file at the same publicId. */
export function uploadPolicyFile(buffer: Buffer, folder: string, publicId: string): Promise<{ publicId: string; url: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder,
        public_id: publicId,
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary upload failed'));
          return;
        }
        resolve({ publicId: result.public_id, url: result.secure_url });
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}
