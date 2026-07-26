import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

export const JWT_SECRET = process.env.JWT_SECRET as string;
export const TOKEN_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: TOKEN_MAX_AGE_MS,
};

/** Sets the httpOnly cookie and returns the JWT for Bearer clients (e.g. Safari). */
export const issueAuthCookie = (res: Response, user: { id: string; role: Role }): string => {
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
  res.cookie('token', token, cookieOptions);
  return token;
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie('token', { httpOnly: cookieOptions.httpOnly, secure: cookieOptions.secure, sameSite: cookieOptions.sameSite });
};
