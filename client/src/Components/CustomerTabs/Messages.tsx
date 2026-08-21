import { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, Send, Trash2, RefreshCw, UserCircle2 } from 'lucide-react';
import { API_BASE } from '../../config';

interface CustomerMessage {
  id: string;
  text: string;
  createdAt: string;
  customerId: string;
  createdBy?: { id: string; name: string };
}

interface MessagesProps {
  customerId?: string | null;
  customerName?: string | null;
}

export default function Messages({ customerId, customerName }: MessagesProps) {
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMessages = async () => {
    if (!customerId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/messages/customer/${customerId}`);
      setMessages(res.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, [customerId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !customerId) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/api/messages`, { customerId, text: text.trim() });
      setMessages((prev) => [res.data, ...prev]);
      setText('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await axios.delete(`${API_BASE}/api/messages/${id}`);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  if (!customerId) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-8 px-8 py-8 animate-fade-in-up max-md:px-4 max-md:py-6">
        <div className="shrink-0 bg-surface border border-border rounded-xl px-8 py-16 flex flex-col items-center justify-center gap-3 text-center shadow-card">
          <UserCircle2 size={36} className="text-neutral-300" />
          <div className="text-base font-bold text-text">Select a customer to view messages</div>
          <div className="text-sm text-text-muted max-w-[360px]">Go to the Customer List tab and check a customer's row, or click the message button on their row.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-6 px-8 py-8 animate-fade-in-up max-md:px-4 max-md:py-6 max-md:gap-5">

      {/* Selected customer banner */}
      <div className="shrink-0 bg-surface border border-border rounded-xl px-7 py-5 flex items-center gap-3 shadow-card">
        <MessageSquare size={20} className="text-primary-600 shrink-0" />
        <div className="text-sm text-text">
          Messages for <span className="font-semibold">{customerName}</span>
        </div>
      </div>

      {/* New message form */}
      <form onSubmit={handleSend} className="shrink-0 bg-surface border border-border rounded-xl p-5 shadow-card flex flex-col gap-3">
        <textarea
          className="w-full min-h-[80px] p-3 text-sm text-text bg-surface border border-border rounded-lg outline-none transition-all resize-y placeholder:text-neutral-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          placeholder={`Write a message about ${customerName || 'this customer'}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="self-end px-5 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all bg-primary-600 text-white border-none hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          <Send size={16} /> {submitting ? 'Sending...' : 'Add Message'}
        </button>
      </form>

      {/* Messages list */}
      {loading ? (
        <div className="shrink-0 flex justify-center p-8"><RefreshCw size={20} className="animate-spin text-primary-500" /></div>
      ) : messages.length > 0 ? (
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <div key={m.id} className="bg-surface border border-border rounded-xl p-4 shadow-card flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text whitespace-pre-wrap break-words">{m.text}</p>
                <p className="text-xs text-text-muted mt-2">
                  {m.createdBy?.name ? `${m.createdBy.name} · ` : ''}
                  {new Date(m.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
              <button
                className="shrink-0 bg-transparent border-none p-1.5 cursor-pointer text-text-muted rounded transition-all hover:text-danger-600 hover:bg-danger-50"
                title="Delete message"
                onClick={() => handleDelete(m.id)}
              ><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      ) : (
        <div className="shrink-0 bg-surface border border-border rounded-xl px-8 py-16 flex flex-col items-center justify-center gap-4 text-center max-md:px-4 max-md:py-10 shadow-card">
          <MessageSquare size={42} className="text-neutral-300" />
          <div className="text-lg font-bold text-text">No messages yet</div>
          <div className="text-sm text-text-muted max-w-[320px]">Use the form above to add the first message about {customerName}.</div>
        </div>
      )}
    </div>
  );
}
