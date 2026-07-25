import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/prisma.js';
import { issueAuthCookie, clearAuthCookie } from '../utils/authToken.js';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    issueAuthCookie(res, user);
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  clearAuthCookie(res);
  res.json({ success: true });
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const hashInvitationToken = (rawToken: string): string => crypto.createHash('sha256').update(rawToken).digest('hex');

export const getInvitation = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;

  try {
    const invitation = await prisma.invitation.findUnique({ where: { tokenHash: hashInvitationToken(token) } });
    if (!invitation) {
      res.status(404).json({ error: 'Invalid or expired invitation link' });
      return;
    }
    if (invitation.usedAt) {
      res.status(409).json({ error: 'This invitation has already been used' });
      return;
    }
    if (invitation.expiresAt < new Date()) {
      res.status(410).json({ error: 'This invitation has expired' });
      return;
    }
    res.json({ name: invitation.name, email: invitation.email, role: invitation.role });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const acceptInvitation = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  try {
    const invitation = await prisma.invitation.findUnique({ where: { tokenHash: hashInvitationToken(token) } });
    if (!invitation) {
      res.status(404).json({ error: 'Invalid or expired invitation link' });
      return;
    }
    if (invitation.usedAt) {
      res.status(409).json({ error: 'This invitation has already been used' });
      return;
    }
    if (invitation.expiresAt < new Date()) {
      res.status(410).json({ error: 'This invitation has expired' });
      return;
    }

    if (!password || String(password).length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }
    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email: invitation.email } });
    if (existingUser) {
      res.status(409).json({ error: 'An account with that email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: invitation.name,
          email: invitation.email,
          passwordHash,
          role: invitation.role,
        },
      });
      await tx.invitation.update({ where: { id: invitation.id }, data: { usedAt: new Date() } });
      return createdUser;
    });

    issueAuthCookie(res, user);
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'An account with that email already exists' });
      return;
    }
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
