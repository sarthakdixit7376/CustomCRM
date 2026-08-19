import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bell, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { API_BASE } from '../config';
import { useNavigate } from 'react-router-dom';

interface Reminder {
  id: string;
  text: string;
  remindAt: string;
  isRead: boolean;
  customer?: { customerName: string };
}

export default function NotificationBell() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchDueReminders = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/reminders/due`);
      setReminders(res.data);
    } catch (error) {
      console.error('Error fetching due reminders:', error);
    }
  };

  useEffect(() => {
    fetchDueReminders();
    // Poll every 60 seconds
    const interval = setInterval(fetchDueReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await axios.patch(`${API_BASE}/api/reminders/${id}/read`);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.patch(`${API_BASE}/api/reminders/read-all`);
      setReminders([]);
      setIsOpen(false);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleViewCustomer = (customerId: string | undefined) => {
    if (customerId) {
      // Logic to navigate to customer's reminders tab could be added here
      // For now, we'll just go to the customers page
      navigate('/customers');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-text-muted hover:text-text bg-neutral-50 hover:bg-neutral-100 border border-border p-2 rounded-md transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {reminders.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-surface min-w-[20px] text-center">
            {reminders.length > 99 ? '99+' : reminders.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 -ml-2 w-80 bg-surface border border-border rounded-lg shadow-dropdown z-50 flex flex-col max-h-[400px] animate-fade-in-up sm:-ml-2 max-md:right-0 max-md:left-auto">
          <div className="p-3 border-b border-border flex justify-between items-center bg-neutral-50 rounded-t-lg">
            <h3 className="text-sm font-semibold text-text flex items-center gap-2">
              <Bell size={16} className="text-primary-500" /> Notifications
            </h3>
            {reminders.length > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {reminders.length === 0 ? (
              <div className="py-8 text-center text-text-muted">
                <CheckCircle2 size={32} className="mx-auto mb-2 text-neutral-300" />
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              reminders.map(reminder => (
                <div 
                  key={reminder.id} 
                  className="p-3 rounded-md hover:bg-neutral-50 transition-colors border border-transparent hover:border-border cursor-pointer flex gap-3 items-start"
                  onClick={() => handleViewCustomer((reminder as any).customerId)}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <AlertCircle size={16} className="text-danger-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text font-medium truncate">
                      {reminder.customer?.customerName || 'Customer'}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                      {reminder.text}
                    </p>
                    <p className="text-[10px] text-text-muted mt-1.5 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(reminder.remindAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => handleMarkAsRead(reminder.id, e)}
                    className="p-1 text-text-muted hover:text-success-600 hover:bg-success-50 rounded transition-colors"
                    title="Mark as read"
                  >
                    <CheckCircle2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
          
          <div className="p-2 border-t border-border bg-neutral-50 rounded-b-lg text-center">
            <button 
              onClick={() => {
                navigate('/customers');
                setIsOpen(false);
              }}
              className="text-xs text-text-muted hover:text-primary-600 font-medium w-full py-1"
            >
              View all in Customers
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
