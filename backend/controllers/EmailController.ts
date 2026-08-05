import { Request, Response } from 'express';
import crypto from 'crypto';
import { EmailAccount } from '@prisma/client';
import prisma from '../config/prisma.js';
import { encrypt } from '../utils/tokenCrypto.js';
import {
  getAuthUrl,
  exchangeCodeForTokens,
  getConnectedEmailAddress,
  getAuthorizedClient,
  listMessages as gmailListMessages,
  getMessage as gmailGetMessage,
  sendMessage as gmailSendMessage,
} from '../services/gmailService.js';

const STATE_COOKIE = 'gmail_oauth_state';
const isProd = process.env.NODE_ENV === 'production';

const stateCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 5 * 60 * 1000,
};

const getOwnedAccount = async (userId: string, accountId: string): Promise<EmailAccount | null> => {
  const account = await prisma.emailAccount.findUnique({ where: { id: accountId } });
  if (!account || account.userId !== userId) return null;
  return account;
};

/** Builds a Gmail search query that matches mail sent OR received from the given address, across the whole mailbox. */
const buildSearchQuery = (search: unknown): string | undefined => {
  if (typeof search !== 'string') return undefined;
  const value = search.trim().replace(/"/g, '');
  if (!value) return undefined;
  return `(from:"${value}" OR to:"${value}")`;
};

const isReauthError = (err: any): boolean =>
  err?.response?.status === 401 ||
  err?.response?.data?.error === 'invalid_grant' ||
  /invalid_grant/i.test(err?.message || '');

export const connectGmail = (req: Request, res: Response): void => {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie(STATE_COOKIE, state, stateCookieOptions);
  res.redirect(getAuthUrl(state));
};

export const oauthCallback = async (req: Request, res: Response): Promise<void> => {
  const frontendUrl = process.env.FRONTEND_URL;
  const { code, state, error } = req.query;
  const cookieState = req.cookies?.[STATE_COOKIE];
  res.clearCookie(STATE_COOKIE, { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax' });

  if (error) {
    res.redirect(`${frontendUrl}/email?error=access_denied`);
    return;
  }
  if (!code || !state || !cookieState || state !== cookieState) {
    res.redirect(`${frontendUrl}/email?error=invalid_state`);
    return;
  }

  try {
    const tokens = await exchangeCodeForTokens(String(code));
    const email = await getConnectedEmailAddress(tokens.accessToken);
    const existingCount = await prisma.emailAccount.count({ where: { userId: req.user!.id } });

    await prisma.emailAccount.upsert({
      where: { userId_email: { userId: req.user!.id, email } },
      update: {
        accessToken: encrypt(tokens.accessToken),
        refreshToken: encrypt(tokens.refreshToken),
        tokenExpiry: new Date(tokens.expiryDate),
      },
      create: {
        userId: req.user!.id,
        email,
        accessToken: encrypt(tokens.accessToken),
        refreshToken: encrypt(tokens.refreshToken),
        tokenExpiry: new Date(tokens.expiryDate),
        isDefault: existingCount === 0,
      },
    });

    res.redirect(`${frontendUrl}/email`);
  } catch (err) {
    console.error('Error completing Gmail OAuth flow:', err);
    res.redirect(`${frontendUrl}/email?error=connect_failed`);
  }
};

export const listAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const accounts = await prisma.emailAccount.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, email: true, isDefault: true, createdAt: true },
    });
    res.json(accounts);
  } catch (error) {
    console.error('Error listing email accounts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const setDefaultAccount = async (req: Request, res: Response): Promise<void> => {
  const { accountId } = req.params;

  try {
    const account = await getOwnedAccount(req.user!.id, accountId);
    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    await prisma.$transaction([
      prisma.emailAccount.updateMany({ where: { userId: req.user!.id }, data: { isDefault: false } }),
      prisma.emailAccount.update({ where: { id: accountId }, data: { isDefault: true } }),
    ]);

    res.json({ ok: true });
  } catch (error) {
    console.error('Error setting default email account:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const disconnectAccount = async (req: Request, res: Response): Promise<void> => {
  const { accountId } = req.params;

  try {
    const account = await getOwnedAccount(req.user!.id, accountId);
    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    await prisma.emailAccount.delete({ where: { id: accountId } });
    res.status(204).send();
  } catch (error) {
    console.error('Error disconnecting email account:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const listMessages = async (req: Request, res: Response): Promise<void> => {
  const { accountId, pageToken, search } = req.query;

  if (!accountId || typeof accountId !== 'string') {
    res.status(400).json({ error: 'accountId is required' });
    return;
  }

  try {
    const account = await getOwnedAccount(req.user!.id, accountId);
    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    const gmail = getAuthorizedClient(account);
    const q = buildSearchQuery(search);
    const result = await gmailListMessages(gmail, { pageToken: typeof pageToken === 'string' ? pageToken : undefined, q });
    res.json(result);
  } catch (error: any) {
    if (isReauthError(error)) {
      res.status(409).json({ error: 'reauth_required' });
      return;
    }
    console.error('Error listing messages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  const { accountId, to, subject, body } = req.body;

  if (!accountId || !to || !body) {
    res.status(400).json({ error: 'accountId, to, and body are required' });
    return;
  }
  if (/[\r\n]/.test(to) || /[\r\n]/.test(subject || '')) {
    res.status(400).json({ error: 'Invalid characters in recipient or subject' });
    return;
  }

  try {
    const account = await getOwnedAccount(req.user!.id, accountId);
    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    const gmail = getAuthorizedClient(account);
    const result = await gmailSendMessage(gmail, { from: account.email, to, subject: subject || '', body });
    res.status(201).json(result);
  } catch (error: any) {
    if (isReauthError(error)) {
      res.status(409).json({ error: 'reauth_required' });
      return;
    }
    if (error?.response?.status === 400) {
      res.status(400).json({ error: error.response.data?.error?.message || 'Invalid message' });
      return;
    }
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getMessage = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { accountId } = req.query;

  if (!accountId || typeof accountId !== 'string') {
    res.status(400).json({ error: 'accountId is required' });
    return;
  }

  try {
    const account = await getOwnedAccount(req.user!.id, accountId);
    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    const gmail = getAuthorizedClient(account);
    const message = await gmailGetMessage(gmail, id);
    res.json(message);
  } catch (error: any) {
    if (isReauthError(error)) {
      res.status(409).json({ error: 'reauth_required' });
      return;
    }
    console.error('Error fetching message:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
