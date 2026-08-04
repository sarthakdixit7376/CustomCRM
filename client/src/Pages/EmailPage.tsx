import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { Mail, Plus, Star, Trash2, Paperclip, PenSquare, ArrowLeft } from 'lucide-react';
import { API_BASE } from '../config';
import ComposeModal from '../Components/Email/ComposeModal';

interface EmailAccount {
  id: string;
  email: string;
  isDefault: boolean;
  createdAt: string;
}

interface MessageSummary {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  isUnread: boolean;
}

interface MessageDetail {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  body: { text: string | null; html: string | null };
  attachments: { filename: string; mimeType: string; size: number; attachmentId: string }[];
}

const POLL_INTERVAL_MS = 30_000;

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Google sign-in was cancelled before granting access.',
  invalid_state: 'The connection request expired or was invalid. Please try again.',
  connect_failed: 'Something went wrong connecting that account. Please try again.',
};

export default function EmailPage() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [reauthNeeded, setReauthNeeded] = useState(false);

  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<MessageDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [composeOpen, setComposeOpen] = useState(false);

  const [pendingNewMessages, setPendingNewMessages] = useState<MessageSummary[]>([]);
  const messagesRef = useRef<MessageSummary[]>([]);
  const selectedAccountIdRef = useRef<string | null>(null);

  const errorCode = searchParams.get('error');

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    selectedAccountIdRef.current = selectedAccountId;
  }, [selectedAccountId]);

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await axios.get(`${API_BASE}/api/email/accounts`);
      setAccounts(res.data);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      const defaultAccount = accounts.find((a) => a.isDefault) || accounts[0];
      setSelectedAccountId(defaultAccount.id);
    }
  }, [accounts, selectedAccountId]);

  const fetchMessages = async (accountId: string, pageToken?: string) => {
    setLoadingMessages(true);
    if (!pageToken) setReauthNeeded(false);
    try {
      const res = await axios.get(`${API_BASE}/api/email/messages`, { params: { accountId, pageToken } });
      setMessages((prev) => (pageToken ? [...prev, ...res.data.messages] : res.data.messages));
      setNextPageToken(res.data.nextPageToken);
    } catch (err: any) {
      if (err.response?.status === 409 && err.response.data?.error === 'reauth_required') {
        setReauthNeeded(true);
        setMessages([]);
        setNextPageToken(null);
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedAccountId) {
      setMessages([]);
      setNextPageToken(null);
      setSelectedMessageId(null);
      setSelectedMessage(null);
      setPendingNewMessages([]);
      fetchMessages(selectedAccountId);
    }
  }, [selectedAccountId]);

  const pollForNewMessages = async (accountId: string) => {
    try {
      const res = await axios.get(`${API_BASE}/api/email/messages`, { params: { accountId } });
      if (selectedAccountIdRef.current !== accountId) return; // account switched while this request was in flight
      const existingIds = new Set(messagesRef.current.map((m) => m.id));
      setPendingNewMessages((prevPending) => {
        const pendingIds = new Set(prevPending.map((m) => m.id));
        const fresh = (res.data.messages as MessageSummary[]).filter((m) => !existingIds.has(m.id) && !pendingIds.has(m.id));
        return fresh.length > 0 ? [...fresh, ...prevPending] : prevPending;
      });
    } catch {
      // Silent — a failed background poll shouldn't disrupt the UI; the next tick or a manual reload will recover.
    }
  };

  useEffect(() => {
    if (!selectedAccountId) return;
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        pollForNewMessages(selectedAccountId);
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [selectedAccountId]);

  const handleShowNewMessages = () => {
    setMessages((prev) => [...pendingNewMessages, ...prev]);
    setPendingNewMessages([]);
  };

  const handleBackToList = () => {
    setSelectedMessageId(null);
    setSelectedMessage(null);
  };

  const handleSelectMessage = async (message: MessageSummary) => {
    if (!selectedAccountId) return;
    setSelectedMessageId(message.id);
    setLoadingDetail(true);
    try {
      const res = await axios.get(`${API_BASE}/api/email/messages/${message.id}`, {
        params: { accountId: selectedAccountId },
      });
      setSelectedMessage(res.data);
    } catch {
      setSelectedMessage(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleConnect = () => {
    window.location.href = `${API_BASE}/api/email`;
  };

  const handleSetDefault = async (accountId: string) => {
    await axios.patch(`${API_BASE}/api/email/accounts/${accountId}/default`);
    fetchAccounts();
  };

  const handleDisconnect = async (account: EmailAccount) => {
    if (!window.confirm(`Disconnect ${account.email}?`)) return;
    await axios.delete(`${API_BASE}/api/email/accounts/${account.id}`);
    if (selectedAccountId === account.id) setSelectedAccountId(null);
    fetchAccounts();
  };

  const dismissError = () => {
    searchParams.delete('error');
    setSearchParams(searchParams, { replace: true });
  };

  return (
    <div className="font-sans bg-surface-muted text-text h-full flex flex-col overflow-hidden">
      <header className="shrink-0 px-8 pt-6 pb-4 flex items-center justify-between gap-4 flex-wrap max-md:px-4 max-md:pt-4">
        <h1 className="text-xl font-bold m-0 text-text">Email</h1>
        <div className="flex items-center gap-2">
          {accounts.length > 0 && (
            <button
              onClick={() => setComposeOpen(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-white bg-primary-600 border-none rounded-lg px-4 py-2 cursor-pointer hover:bg-primary-700"
            >
              <PenSquare size={16} />
              Compose
            </button>
          )}
          <button
            onClick={handleConnect}
            className="flex items-center gap-1.5 text-sm font-medium text-text-muted bg-surface border border-border rounded-lg px-4 py-2 cursor-pointer hover:bg-neutral-50 hover:text-text"
          >
            <Plus size={16} />
            Connect Gmail account
          </button>
        </div>
      </header>

      {errorCode && (
        <div className="shrink-0 mx-8 mb-4 max-md:mx-4 flex items-center justify-between gap-3 bg-danger-50 border border-danger-100 text-danger-600 text-sm rounded-lg px-4 py-3">
          <span>{ERROR_MESSAGES[errorCode] || 'Something went wrong connecting your Gmail account.'}</span>
          <button onClick={dismissError} className="text-danger-600 font-medium hover:underline cursor-pointer bg-transparent border-none">
            Dismiss
          </button>
        </div>
      )}

      <div className="shrink-0 px-8 pb-4 max-md:px-4">
        {loadingAccounts ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 text-center py-20 bg-surface border border-border rounded-xl shadow-card">
            <Mail size={32} className="text-text-muted" />
            <p className="text-sm text-text-muted max-w-sm">
              No Gmail accounts connected yet. Connect one to start reading and sending email from the CRM.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-card">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-text-muted bg-neutral-50 border-b border-border">
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wider">Account</th>
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wider">Connected</th>
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-b border-border last:border-b-0 hover:bg-neutral-50">
                    <td className="py-2.5 px-4 text-text font-medium">
                      <div className="flex items-center gap-2">
                        {account.email}
                        {account.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-600">
                            <Star size={10} />
                            Default
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-text-muted">{new Date(account.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {!account.isDefault && (
                          <button
                            className="text-xs font-medium text-text-muted bg-surface border border-border rounded px-3 py-1.5 cursor-pointer hover:bg-neutral-50 hover:text-text"
                            onClick={() => handleSetDefault(account.id)}
                          >
                            Set default
                          </button>
                        )}
                        <button
                          className="flex items-center gap-1 text-xs font-medium text-danger-600 bg-danger-50 border border-danger-100 rounded px-3 py-1.5 cursor-pointer hover:bg-danger-100"
                          onClick={() => handleDisconnect(account)}
                        >
                          <Trash2 size={12} />
                          Disconnect
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {accounts.length > 0 && (
        <>
          <div className="shrink-0 px-8 pb-2 max-md:px-4 flex items-center gap-2">
            <label className="text-xs font-medium text-text-muted">Viewing inbox for</label>
            <select
              value={selectedAccountId || ''}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary-400"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.email}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-h-0 px-8 pb-8 max-md:px-4 flex gap-4">
            <div
              className={`w-80 max-md:w-full shrink-0 border border-border rounded-lg bg-surface overflow-y-auto ${
                selectedMessageId ? 'max-md:hidden' : ''
              }`}
            >
              {pendingNewMessages.length > 0 && (
                <button
                  onClick={handleShowNewMessages}
                  className="sticky top-0 z-10 w-full text-center text-xs font-semibold text-primary-700 bg-primary-50 border-b border-border py-2 cursor-pointer hover:bg-primary-100"
                >
                  {pendingNewMessages.length} new message{pendingNewMessages.length > 1 ? 's' : ''} — click to show
                </button>
              )}
              {loadingMessages && messages.length === 0 ? (
                <p className="text-sm text-text-muted p-4">Loading messages…</p>
              ) : reauthNeeded ? (
                <div className="flex flex-col items-center gap-2 text-center p-6">
                  <p className="text-sm text-text-muted">This account needs to be reconnected.</p>
                  <button
                    onClick={handleConnect}
                    className="text-xs font-semibold bg-primary-600 text-white rounded px-3 py-1.5 cursor-pointer hover:bg-primary-700"
                  >
                    Reconnect
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <p className="text-sm text-text-muted p-4">No messages in this inbox.</p>
              ) : (
                <>
                  {messages.map((message) => (
                    <button
                      key={message.id}
                      onClick={() => handleSelectMessage(message)}
                      className={`w-full text-left px-4 py-3 border-b border-border last:border-b-0 cursor-pointer transition-colors ${
                        selectedMessageId === message.id ? 'bg-primary-50' : 'hover:bg-neutral-50'
                      }`}
                    >
                      <div className={`flex items-center justify-between gap-2 text-sm ${message.isUnread ? 'font-semibold text-text' : 'text-text-muted'}`}>
                        <span className="truncate">{message.from}</span>
                        <span className="shrink-0 text-xs">{message.date && new Date(message.date).toLocaleDateString()}</span>
                      </div>
                      <p className={`text-sm truncate ${message.isUnread ? 'font-semibold text-text' : 'text-text'}`}>{message.subject || '(no subject)'}</p>
                      <p className="text-xs text-text-muted truncate">{message.snippet}</p>
                    </button>
                  ))}
                  {nextPageToken && (
                    <div className="p-3 text-center">
                      <button
                        onClick={() => selectedAccountId && fetchMessages(selectedAccountId, nextPageToken)}
                        disabled={loadingMessages}
                        className="text-xs font-medium text-text-muted bg-surface border border-border rounded px-3 py-1.5 cursor-pointer hover:bg-neutral-50 hover:text-text disabled:opacity-50"
                      >
                        {loadingMessages ? 'Loading…' : 'Load more'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div
              className={`flex-1 min-w-0 border border-border rounded-lg bg-surface overflow-y-auto flex flex-col ${
                selectedMessageId ? '' : 'max-md:hidden'
              }`}
            >
              <button
                onClick={handleBackToList}
                className="hidden max-md:flex shrink-0 items-center gap-1.5 text-sm font-medium text-text-muted px-4 py-3 border-b border-border cursor-pointer hover:text-text"
              >
                <ArrowLeft size={16} />
                Back to inbox
              </button>
              {loadingDetail ? (
                <p className="text-sm text-text-muted p-6">Loading message…</p>
              ) : !selectedMessage ? (
                <div className="flex-1 flex items-center justify-center text-sm text-text-muted">Select a message to read it</div>
              ) : (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="shrink-0 p-6 border-b border-border">
                    <h2 className="text-lg font-semibold text-text m-0">{selectedMessage.subject || '(no subject)'}</h2>
                    <p className="text-sm text-text-muted mt-1">
                      From: {selectedMessage.from}
                      {selectedMessage.to && <> · To: {selectedMessage.to}</>}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">{selectedMessage.date}</p>
                    {selectedMessage.attachments.length > 0 && (
                      <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
                        <Paperclip size={12} />
                        {selectedMessage.attachments.length} attachment{selectedMessage.attachments.length > 1 ? 's' : ''} (download coming soon)
                      </p>
                    )}
                  </div>
                  <div className="flex-1 min-h-0">
                    {selectedMessage.body.html ? (
                      <iframe
                        sandbox=""
                        srcDoc={selectedMessage.body.html}
                        title="Email content"
                        className="w-full h-full border-0 bg-white"
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans text-sm text-text p-6 m-0">{selectedMessage.body.text || '(no content)'}</pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {composeOpen && (
        <ComposeModal
          accounts={accounts}
          defaultAccountId={selectedAccountId}
          onClose={() => setComposeOpen(false)}
          onSent={() => {}}
        />
      )}
    </div>
  );
}
