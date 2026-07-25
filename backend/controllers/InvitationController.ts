import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/prisma.js';
import { sendInvitationEmail } from '../services/emailService.js';

const toSafeInvitation = (invitation: { id: string; name: string; email: string; role: string; expiresAt: Date; createdAt: Date }) => ({
  id: invitation.id,
  name: invitation.name,
  email: invitation.email,
  role: invitation.role,
  expiresAt: invitation.expiresAt,
  createdAt: invitation.createdAt,
});

export const createInvitation = async (req: Request, res: Response): Promise<void> => {
  const { name, email, role } = req.body;

  if (!name || !email) {
    res.status(400).json({ error: 'Name and email are required' });
    return;
  }
  if (role && role !== 'ADMIN' && role !== 'AGENT') {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }

  const normalizedEmail = String(email).toLowerCase();

  try {
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      res.status(409).json({ error: 'A user with that email already exists' });
      return;
    }

    const pendingInvitation = await prisma.invitation.findFirst({
      where: { email: normalizedEmail, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (pendingInvitation) {
      res.status(409).json({ error: 'An invitation is already pending for that email' });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiryHours = Number(process.env.INVITATION_EXPIRY_HOURS) || 168;
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    const invitation = await prisma.invitation.create({
      data: {
        name,
        email: normalizedEmail,
        role: role || 'AGENT',
        tokenHash,
        expiresAt,
        createdById: req.user!.id,
      },
    });

    const inviteLink = `${process.env.FRONTEND_URL}/invite?token=${rawToken}`;

    let emailSent = true;
    try {
      await sendInvitationEmail(normalizedEmail, name, inviteLink);
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      emailSent = false;
    }

    res.status(201).json({ ...toSafeInvitation(invitation), emailSent });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'An invitation is already pending for that email' });
      return;
    }
    console.error('Error creating invitation:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const listInvitations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const invitations = await prisma.invitation.findMany({
      where: { usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    res.json(invitations.map(toSafeInvitation));
  } catch (error) {
    console.error('Error listing invitations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const revokeInvitation = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    await prisma.invitation.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }
    console.error('Error revoking invitation:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
