import { useState } from 'react';
import axios from 'axios';
import { Pencil, Check, X } from 'lucide-react';
import { API_BASE } from '../../config';

interface ContactsProps {
  customers: any[];
  onCustomerUpdated: (updated: any) => void;
}

interface EditForm {
  customerName: string;
  phoneNumber: string;
  email: string;
}

export default function Contacts({ customers, onCustomerUpdated }: ContactsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EditForm>({ customerName: '', phoneNumber: '', email: '' });
  const [saving, setSaving] = useState(false);

  const startEdit = (c: any) => {
    setEditingId(c.id);
    setForm({ customerName: c.customerName || '', phoneNumber: c.phoneNumber || '', email: c.email || '' });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const res = await axios.put(`${API_BASE}/api/customers/${id}`, form);
      onCustomerUpdated(res.data);
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update contact', error);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-2.5 py-1.5 text-sm text-text bg-surface border border-border rounded-md outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-100";

  return (
    <div className="flex-1 overflow-auto px-8 pb-8 max-md:px-4 max-md:pb-4 mt-8">
      <div className="border border-border rounded-lg overflow-x-auto bg-surface shadow-card mt-0 animate-fade-in-up">
        <table className="w-full border-collapse table-auto">
          <thead className="sticky top-0 z-[2]">
            <tr>
              {['Name', 'Phone Number', 'Email'].map((h) => (
                <th key={h} className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border whitespace-nowrap">{h}</th>
              ))}
              <th className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border" style={{ width: 90 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length > 0 ? (
              customers.map((c) => {
                const isEditing = editingId === c.id;
                return (
                  <tr key={c.id} className="transition-colors hover:bg-neutral-50">
                    <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap">
                      {isEditing ? (
                        <input
                          className={inputClass}
                          value={form.customerName}
                          onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
                        />
                      ) : (
                        <span className="text-text font-medium">{c.customerName}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="tel"
                          className={inputClass}
                          placeholder="Phone number"
                          value={form.phoneNumber}
                          onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                        />
                      ) : (
                        <span className="text-text-muted">{c.phoneNumber || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="email"
                          className={inputClass}
                          placeholder="Email"
                          value={form.email}
                          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        />
                      ) : (
                        <span className="text-text-muted">{c.email || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <button
                            disabled={saving}
                            onClick={() => saveEdit(c.id)}
                            className="text-success-600 hover:text-success-700 bg-transparent border-none cursor-pointer transition-colors p-1.5 rounded hover:bg-success-50 disabled:opacity-50 disabled:cursor-wait"
                            title="Save"
                          ><Check size={16} /></button>
                          <button
                            disabled={saving}
                            onClick={cancelEdit}
                            className="text-text-muted hover:text-danger-600 bg-transparent border-none cursor-pointer transition-colors p-1.5 rounded hover:bg-danger-50 disabled:opacity-50"
                            title="Cancel"
                          ><X size={16} /></button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(c)}
                          className="text-text-muted hover:text-primary-600 bg-transparent border-none cursor-pointer transition-colors p-1.5 rounded hover:bg-primary-50"
                          title="Edit contact info"
                        ><Pencil size={16} /></button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-10 text-text-muted">No customers yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
