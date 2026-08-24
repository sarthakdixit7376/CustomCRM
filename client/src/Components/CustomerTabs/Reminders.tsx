import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Bell, Calendar, Clock, Edit2, Trash2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { API_BASE } from '../../config';

interface Reminder {
  id: string;
  text: string;
  remindAt: string;
  isRead: boolean;
  isAuto: boolean;
  customerId: string;
  customer?: { id: string; customerName: string };
}

interface RemindersProps {
  customerId?: string | null;
}

export default function Reminders({ customerId }: RemindersProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  // Form State
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const url = customerId 
        ? `${API_BASE}/api/reminders/customer/${customerId}` 
        : `${API_BASE}/api/reminders`;
      const res = await axios.get(url);
      setReminders(res.data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [customerId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !date || !time) return;

    // Combine date and time
    const remindAt = new Date(`${date}T${time}`).toISOString();

    try {
      if (isEditing) {
        await axios.put(`${API_BASE}/api/reminders/${isEditing}`, { text, remindAt });
      } else {
        await axios.post(`${API_BASE}/api/reminders`, {
          customerId: customerId || '', // Depending on where it's used, customerId should be available
          text,
          remindAt,
        });
      }
      
      resetForm();
      fetchReminders();
    } catch (error) {
      console.error('Error saving reminder:', error);
    }
  };

  const resetForm = () => {
    setText('');
    setDate('');
    setTime('');
    setIsAdding(false);
    setIsEditing(null);
  };

  const handleEdit = (reminder: Reminder) => {
    const rDate = new Date(reminder.remindAt);
    setText(reminder.text);
    // Adjust for local timezone offset when setting input values
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(rDate.getTime() - tzoffset)).toISOString();
    setDate(localISOTime.split('T')[0]);
    setTime(localISOTime.substring(11, 16));
    setIsEditing(reminder.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    try {
      await axios.delete(`${API_BASE}/api/reminders/${id}`);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const handleToggleCompleted = async (id: string, isRead: boolean) => {
    try {
      await axios.patch(`${API_BASE}/api/reminders/${id}/read`, { isRead });
      setReminders(prev => prev.map(r => r.id === id ? { ...r, isRead } : r));
    } catch (error) {
      console.error('Error updating completed status:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><RefreshCw className="animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="p-6 bg-surface animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-text flex items-center gap-2">
          <Bell size={20} className="text-primary-500" /> Reminders {customerId ? '' : '(All)'}
        </h2>
        {!isAdding && customerId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} /> Add Reminder
          </button>
        )}
      </div>

      {!customerId && (
        <div className="mb-6 p-4 bg-primary-50 border border-primary-100 rounded-lg text-primary-800 text-sm flex items-center gap-2">
          <AlertCircle size={16} className="text-primary-600" />
          <span>Showing all reminders. To add a new reminder, please select a customer from the Customer List first.</span>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleSave} className="bg-neutral-50 p-4 rounded-lg border border-border mb-6">
          <h3 className="text-md font-semibold mb-4">{isEditing ? 'Edit Reminder' : 'New Reminder'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-muted mb-1">Reminder Text</label>
              <input
                type="text"
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full p-2 border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="E.g., Call customer about renewal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 p-2 border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Time</label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-9 p-2 border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-border rounded-md hover:bg-neutral-100 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              {isEditing ? 'Save Changes' : 'Save Reminder'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {reminders.length === 0 ? (
          <p className="text-center text-text-muted py-8">No reminders found.</p>
        ) : (
          reminders.map((reminder) => {
            const isDue = new Date(reminder.remindAt) <= new Date() && !reminder.isRead;
            return (
              <div 
                key={reminder.id} 
                className={`p-4 rounded-lg border transition-all ${
                  reminder.isRead 
                    ? 'bg-neutral-50/50 border-border opacity-75' 
                    : isDue 
                      ? 'bg-danger-50/30 border-danger-200 shadow-sm' 
                      : 'bg-white border-border shadow-sm hover:border-primary-300'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {reminder.isAuto ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-secondary-100 text-secondary-700">
                          <RefreshCw size={12} /> Auto
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-700">
                          Manual
                        </span>
                      )}
                      {isDue && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-danger-100 text-danger-700">
                          <AlertCircle size={12} /> Due
                        </span>
                      )}
                      {reminder.isRead && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-success-100 text-success-700">
                          <CheckCircle2 size={12} /> Completed
                        </span>
                      )}
                    </div>
                    {!customerId && (
                      <p className="text-sm text-text font-medium mb-1">
                        Customer: <span className="text-primary-600">{reminder.customer?.customerName || 'Unknown'}</span>
                      </p>
                    )}
                    <p className={`text-sm ${reminder.isRead ? 'text-text-muted line-through' : 'text-text font-medium'}`}>
                      {reminder.text}
                    </p>
                    <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
                      <Clock size={12} /> 
                      {new Date(reminder.remindAt).toLocaleString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label
                      className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-text-muted select-none"
                      title={reminder.isRead ? 'Mark as incomplete' : 'Mark as Completed'}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-success-600 cursor-pointer"
                        checked={reminder.isRead}
                        onChange={(e) => handleToggleCompleted(reminder.id, e.target.checked)}
                      />
                      Mark as Completed
                    </label>
                    <button
                      onClick={() => handleEdit(reminder)}
                      className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(reminder.id)}
                      className="p-1.5 text-danger-600 hover:bg-danger-50 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
