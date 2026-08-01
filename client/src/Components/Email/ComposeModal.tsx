import { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { API_BASE } from '../../config';

interface ComposeAccount {
  id: string;
  email: string;
}

interface ComposeModalProps {
  accounts: ComposeAccount[];
  defaultAccountId: string | null;
  onClose: () => void;
  onSent: () => void;
}

const inputClass =
  'bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100';

export default function ComposeModal({ accounts, defaultAccountId, onClose, onSent }: ComposeModalProps) {
  const [fromAccountId, setFromAccountId] = useState(defaultAccountId || accounts[0]?.id || '');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await axios.post(`${API_BASE}/api/email/messages/send`, { accountId: fromAccountId, to, subject, body });
      onSent();
      onClose();
    } catch (err: any) {
      if (err.response?.status === 409 && err.response.data?.error === 'reauth_required') {
        setError('This account needs to be reconnected before you can send from it.');
      } else {
        setError(err.response?.data?.error || 'Failed to send message');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl shadow-dropdown w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text m-0">New message</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text p-1 rounded-md hover:bg-neutral-100 cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-5 py-4 overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">From</label>
            <select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} className={inputClass}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.email}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">To</label>
            <input
              type="text"
              required
              autoFocus
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={inputClass}
              placeholder="recipient@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Subject</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Message</label>
            <textarea
              required
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && <p className="text-sm text-danger-600 m-0">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-text-muted bg-surface border border-border rounded-lg px-4 py-2 cursor-pointer hover:bg-neutral-50 hover:text-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || !fromAccountId}
              className="text-sm font-semibold text-white bg-primary-600 border-none rounded-lg px-4 py-2 cursor-pointer hover:bg-primary-700 disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
