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
