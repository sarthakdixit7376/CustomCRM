import { google, gmail_v1 } from 'googleapis';
import { EmailAccount } from '@prisma/client';
import { createOAuth2Client, GMAIL_SCOPES } from '../config/googleOAuth.js';
import prisma from '../config/prisma.js';
import { encrypt, decrypt } from '../utils/tokenCrypto.js';

export const getAuthUrl = (state: string): string => {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'select_account consent',
    scope: GMAIL_SCOPES,
    state,
  });
};

export interface GmailTokens {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
}

export const exchangeCodeForTokens = async (code: string): Promise<GmailTokens> => {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
    throw new Error('Google did not return complete tokens (missing refresh_token — was prompt=consent used?)');
  }
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiryDate: tokens.expiry_date,
  };
};

export const getConnectedEmailAddress = async (accessToken: string): Promise<string> => {
  const client = createOAuth2Client();
  client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ auth: client, version: 'v2' });
  const { data } = await oauth2.userinfo.get();
  if (!data.email) throw new Error('Google did not return an email address for this account');
  return data.email;
};

/** Builds an authorized Gmail client for a stored account, persisting any refreshed tokens Google issues mid-request. */
export const getAuthorizedClient = (account: EmailAccount): gmail_v1.Gmail => {
  const client = createOAuth2Client();
  client.setCredentials({
    access_token: decrypt(account.accessToken),
    refresh_token: decrypt(account.refreshToken),
    expiry_date: account.tokenExpiry.getTime(),
  });

  client.on('tokens', (tokens) => {
    const data: { accessToken?: string; refreshToken?: string; tokenExpiry?: Date } = {};
    if (tokens.access_token) data.accessToken = encrypt(tokens.access_token);
    if (tokens.refresh_token) data.refreshToken = encrypt(tokens.refresh_token);
    if (tokens.expiry_date) data.tokenExpiry = new Date(tokens.expiry_date);
    if (Object.keys(data).length > 0) {
      prisma.emailAccount.update({ where: { id: account.id }, data }).catch((err) => {
        console.error('Failed to persist refreshed Gmail tokens:', err);
      });
    }
  });

  return google.gmail({ version: 'v1', auth: client });
};

const getHeader = (headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string =>
  headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

export interface MessageSummary {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  isUnread: boolean;
}

const toMessageSummary = (message: gmail_v1.Schema$Message): MessageSummary => {
  const headers = message.payload?.headers;
  return {
    id: message.id!,
    threadId: message.threadId!,
    from: getHeader(headers, 'From'),
    subject: getHeader(headers, 'Subject'),
    date: getHeader(headers, 'Date'),
    snippet: message.snippet || '',
    isUnread: (message.labelIds || []).includes('UNREAD'),
  };
};

export interface MessageAttachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}

interface MessageBody {
  text: string | null;
  html: string | null;
  attachments: MessageAttachment[];
}

const walkParts = (part: gmail_v1.Schema$MessagePart, acc: MessageBody): void => {
  if (part.filename && part.body?.attachmentId) {
    acc.attachments.push({
      filename: part.filename,
      mimeType: part.mimeType || 'application/octet-stream',
      size: part.body.size || 0,
      attachmentId: part.body.attachmentId,
    });
    return;
  }
  if (part.mimeType === 'text/plain' && part.body?.data && !acc.text) {
    acc.text = Buffer.from(part.body.data, 'base64url').toString('utf8');
  } else if (part.mimeType === 'text/html' && part.body?.data && !acc.html) {
    acc.html = Buffer.from(part.body.data, 'base64url').toString('utf8');
  }
  for (const child of part.parts || []) {
    walkParts(child, acc);
  }
};

const extractBody = (payload: gmail_v1.Schema$MessagePart | undefined): MessageBody => {
  const acc: MessageBody = { text: null, html: null, attachments: [] };
  if (payload) walkParts(payload, acc);
  return acc;
};

export interface ListMessagesResult {
  messages: MessageSummary[];
  nextPageToken: string | null;
}

export const listMessages = async (
  gmail: gmail_v1.Gmail,
  opts: { pageToken?: string } = {}
): Promise<ListMessagesResult> => {
  const { data } = await gmail.users.messages.list({
    userId: 'me',
    labelIds: ['INBOX'],
    maxResults: 25,
    pageToken: opts.pageToken,
  });

  const messages = await Promise.all(
    (data.messages || []).map(async (m) => {
      const { data: full } = await gmail.users.messages.get({
        userId: 'me',
        id: m.id!,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      });
      return toMessageSummary(full);
    })
  );

  return { messages, nextPageToken: data.nextPageToken || null };
};

export interface MessageDetail {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  body: { text: string | null; html: string | null };
  attachments: MessageAttachment[];
}

export interface SendMessageParams {
  from: string;
  to: string;
  subject: string;
  body: string;
}

const buildRawMessage = ({ from, to, subject, body }: SendMessageParams): string => {
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
  ].join('\r\n');
  const raw = `${headers}\r\n\r\n${body}`;
  return Buffer.from(raw, 'utf8').toString('base64url');
};

export const sendMessage = async (
  gmail: gmail_v1.Gmail,
  params: SendMessageParams
): Promise<{ id: string; threadId: string }> => {
  const { data } = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: buildRawMessage(params) },
  });
  return { id: data.id!, threadId: data.threadId! };
};

export const getMessage = async (gmail: gmail_v1.Gmail, messageId: string): Promise<MessageDetail> => {
  const { data } = await gmail.users.messages.get({ userId: 'me', id: messageId, format: 'full' });
  const headers = data.payload?.headers;
  const { text, html, attachments } = extractBody(data.payload);
  return {
    id: data.id!,
    threadId: data.threadId!,
    from: getHeader(headers, 'From'),
    to: getHeader(headers, 'To'),
    subject: getHeader(headers, 'Subject'),
    date: getHeader(headers, 'Date'),
    body: { text, html },
    attachments,
  };
};
