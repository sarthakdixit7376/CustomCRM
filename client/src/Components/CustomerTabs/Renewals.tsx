import { useState } from 'react';
import axios from 'axios';
import { RefreshCw } from 'lucide-react';
import { API_BASE } from '../../config';

interface RenewalsProps {
  policies: any[];
  onSelectCustomer: (customer: { id: string; customerName: string }) => void;
  onPolicyUpdated: (policy: any) => void;
}

const RENEWAL_STATUS_OPTIONS = [
  { value: 'NOT_CONTACTED', label: 'Not Contacted' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'RENEWED', label: 'Renewed & Closed' },
  { value: 'DECLINED', label: 'Declined' },
];

const RENEWAL_STATUS_BADGE_CLASS: Record<string, string> = {
  NOT_CONTACTED: 'bg-neutral-100 text-text-muted',
  CONTACTED: 'bg-amber-50 text-amber-600',
  RENEWED: 'bg-success-50 text-success-600',
  DECLINED: 'bg-danger-50 text-danger-600',
};

const formatDate = (value: string): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

/** Colors the End Date cell by whether it has already passed. */
const expiryColorClass = (endDate: string): string => {
  if (!endDate) return 'text-text';
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return 'text-text';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end < today ? 'text-danger-600' : 'text-success-600';
};

export default function Renewals({ policies, onSelectCustomer, onPolicyUpdated }: RenewalsProps) {
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleStatusChange = async (policy: any, renewalStatus: string) => {
    setSavingId(policy.id);
    try {
      const res = await axios.put(`${API_BASE}/api/policies/${policy.id}`, { renewalStatus });
      onPolicyUpdated(res.data);
    } catch (error) {
      console.error('Failed to update renewal status', error);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 animate-fade-in-up max-md:px-4 max-md:py-6">
      <div className="border border-border rounded-xl overflow-x-auto bg-surface shadow-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {['Customer Name', 'Policy', 'End Date', 'Status', 'Assigned Agent'].map((h) => (
                <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider bg-neutral-50 border-b border-border whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
          {policies.length > 0 ? (
            policies.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-neutral-50">
                <td className="px-4 py-3 border-b border-border whitespace-nowrap">
                  <div
                    className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => p.customer && onSelectCustomer(p.customer)}
                  >
                    <div className="w-7 h-7 rounded-md bg-primary-50 border border-primary-100 flex items-center justify-center text-[11px] font-bold text-primary-700 shrink-0">
                      {(p.customer?.customerName || '?').charAt(0)}
                    </div>
                    <span className="text-text font-medium">{p.customer?.customerName || '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 border-b border-border whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-text font-medium">{p.policyType || '—'}{p.insuranceCompany ? ` · ${p.insuranceCompany}` : ''}</span>
                    <span className="text-xs text-text-muted">{p.policyNumber ? `Policy #${p.policyNumber}` : ''}</span>
                  </div>
                </td>
                <td className={`px-4 py-3 font-medium border-b border-border whitespace-nowrap ${expiryColorClass(p.endDate)}`}>
                  {formatDate(p.endDate)}
                </td>
                <td className="px-4 py-3 border-b border-border whitespace-nowrap">
                  <div className="inline-flex items-center gap-2">
                    <select
                      value={p.renewalStatus || 'NOT_CONTACTED'}
                      disabled={savingId === p.id}
                      onChange={(e) => handleStatusChange(p, e.target.value)}
                      className={`text-xs font-medium rounded-full px-2.5 py-1 border-none outline-none cursor-pointer disabled:opacity-50 disabled:cursor-wait ${RENEWAL_STATUS_BADGE_CLASS[p.renewalStatus] || RENEWAL_STATUS_BADGE_CLASS.NOT_CONTACTED}`}
                    >
                      {RENEWAL_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {savingId === p.id && <RefreshCw size={12} className="animate-spin text-text-muted" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.customer?.agent?.name || '—'}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={5} className="text-center py-10 text-text-muted">No policies found</td></tr>
          )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
