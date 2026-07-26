import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../config/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface AuthUser {
  id: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const extractToken = (req: Request): string | undefined => {
  if (req.cookies?.token) return req.cookies.token;
  // Fallback for browsers that block cross-site cookies (e.g. iOS Safari).
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice('Bearer '.length);
  return undefined;
};

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; role: Role };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    req.user = { id: user.id, role: user.role };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
};

export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
};
