import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

const getKey = (): Buffer => {
  const key = process.env.EMAIL_TOKEN_ENCRYPTION_KEY;
  if (!key) throw new Error('EMAIL_TOKEN_ENCRYPTION_KEY is not set');
  return Buffer.from(key, 'base64');
};

export const encrypt = (plainText: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':');
};

export const decrypt = (payload: string): string => {
  const [ivB64, authTagB64, dataB64] = payload.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
};
