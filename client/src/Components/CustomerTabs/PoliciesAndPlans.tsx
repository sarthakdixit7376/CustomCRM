import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Layers, Plus, Pencil, X, UserCircle2, Mail, Home, Car, Plane, Search } from 'lucide-react';
import { API_BASE } from '../../config';

interface PoliciesAndPlansProps {
  policies: any[];
  filterCustomer?: { id: string; customerName: string } | null;
  onAddPolicy: (customer: { id: string; customerName: string }) => void;
  onEditPolicy: (policy: any) => void;
  onDeletePolicy: (policyId: string) => void;
}

/* ───────── Helpers ───────── */
const formatDate = (value: string): string => {
  if (!value || value === '-') return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const formatCurrency = (value: any): string => {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  return Number.isNaN(n) ? String(value) : `₪${n.toLocaleString('en-US')}`;
};

/** Icon shown beside the Policy Type text. */
const POLICY_TYPE_ICONS: Record<string, typeof Home> = {
  Home,
  Car,
  Travel: Plane,
};

/** Colors Start/End Date cells by whether the policy's end date has passed. */
const expiryColorClass = (endDate: string): string => {
  if (!endDate || endDate === '-') return 'text-text';
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return 'text-text';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end < today ? 'text-danger-600' : 'text-success-600';
};

/* ───────── Component ───────── */
export default function PoliciesAndPlans({ policies, filterCustomer, onAddPolicy, onEditPolicy, onDeletePolicy }: PoliciesAndPlansProps) {
  const navigate = useNavigate();
  const [carNumberFilter, setCarNumberFilter] = useState('');

  // Reset the car number filter whenever the selected customer changes.
  useEffect(() => { setCarNumberFilter(''); }, [filterCustomer?.id]);

  async function handleRemovePolicy(policyId?: string) {
    if (!policyId) return;
    if (!window.confirm('Delete this policy?')) return;

    try {
      await axios.delete(`${API_BASE}/api/policies/${policyId}`);
      onDeletePolicy(policyId);
    } catch (error) {
      console.error("Failed to delete policy", error);
    }
  }

  const customerPolicies = filterCustomer
    ? policies.filter((p) => p.customerId === filterCustomer.id)
    : [];

  const displayedPolicies = carNumberFilter.trim() === ''
    ? customerPolicies
    : customerPolicies.filter((p) => (p.carNumber ?? '').toLowerCase().includes(carNumberFilter.trim().toLowerCase()));

  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-8 px-8 py-8 animate-fade-in-up max-md:px-4 max-md:py-6 max-md:gap-6">

      {/* Selected customer banner */}
      {filterCustomer ? (
        <div className="shrink-0 bg-surface border border-border rounded-xl px-7 py-5 flex items-center justify-between gap-3 flex-wrap shadow-card">
          <div className="flex items-center gap-3">
            <UserCircle2 size={20} className="text-primary-600 shrink-0" />
            <div className="text-sm text-text">
              Showing policies for <span className="font-semibold">{filterCustomer.customerName}</span>
            </div>
          </div>
          <button
            className="px-5 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all bg-primary-600 text-white border-none hover:bg-primary-700 inline-flex items-center gap-2"
            onClick={() => onAddPolicy(filterCustomer)}
          >
            <Plus size={16} strokeWidth={2.5} /> Add Policy
          </button>
        </div>
      ) : (
        <div className="shrink-0 bg-surface border border-border rounded-xl px-8 py-10 flex flex-col items-center justify-center gap-3 text-center shadow-card">
          <UserCircle2 size={36} className="text-neutral-300" />
          <div className="text-base font-bold text-text">Select a customer to view or add a policy</div>
          <div className="text-sm text-text-muted max-w-[360px]">Go to the Customer List tab and check a customer's row to view their policies here.</div>
        </div>
      )}

      {/* Car Number Filter */}
      {customerPolicies.length > 0 && (
        <div className="shrink-0 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-[280px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              className="w-full py-2.5 pr-4 pl-10 text-sm text-text bg-surface border border-border rounded-lg outline-none transition-all placeholder:text-neutral-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              placeholder="Filter by car number..."
              value={carNumberFilter}
              onChange={(e) => setCarNumberFilter(e.target.value)}
            />
          </div>
          {carNumberFilter && (
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium text-text-muted bg-surface border border-border rounded-lg cursor-pointer transition-all hover:bg-neutral-50 hover:text-text"
              onClick={() => setCarNumberFilter('')}
            >
              <X size={14} /> Clear
            </button>
          )}
          <div className="text-xs text-text-muted whitespace-nowrap ml-auto">
            Showing <span className="text-text font-semibold">{displayedPolicies.length}</span> of{' '}
            <span className="text-text font-semibold">{customerPolicies.length}</span> policies
          </div>
        </div>
      )}

      {/* Policies List */}
      {displayedPolicies.length > 0 ? (
        <div className="shrink-0 border border-border rounded-xl overflow-x-auto bg-surface shadow-card">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {['#', 'Customer', 'Agent Name', 'Insurance Company', 'Policy Type', 'Type', 'Car Number', 'Start Date', 'End Date', 'Manufacturer', 'Glass and More', 'Complementary + VIP', 'Policy Number', 'Amount Paid', 'Documents', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider bg-neutral-50 border-b border-border whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedPolicies.map((p, i) => {
                const PolicyTypeIcon = p.policyType ? POLICY_TYPE_ICONS[p.policyType] : null;
                return (
                <tr key={p.id ?? i} className="transition-colors hover:bg-neutral-50">
                  <td className="px-4 py-3 text-text-muted border-b border-border whitespace-nowrap">{i + 1}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.customer?.customerName || '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.agentName || '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.insuranceCompany || '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">
                    {p.policyType ? (
                      <span className="inline-flex items-center gap-1.5">
                        {PolicyTypeIcon && <PolicyTypeIcon size={20} className="text-primary-600" />}
                        {p.policyType}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.type || '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.carNumber || '—'}</td>
                  <td className={`px-4 py-3 font-medium border-b border-border whitespace-nowrap ${expiryColorClass(p.endDate)}`}>{formatDate(p.startDate)}</td>
                  <td className={`px-4 py-3 font-medium border-b border-border whitespace-nowrap ${expiryColorClass(p.endDate)}`}>{formatDate(p.endDate)}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.manufacturer || '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.glassAndMoreSelected ? 'Yes' : '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.complementaryVipSelected ? 'Yes' : '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.policyNumber || '—'}</td>
                  <td className="px-4 py-3 text-text font-medium border-b border-border whitespace-nowrap">{formatCurrency(p.amountPaid)}</td>
                  <td className="px-4 py-3 text-text-muted border-b border-border whitespace-nowrap">
                    {p.documents?.length > 0 ? (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium"
                        title={p.documents.map((d: any) => d.documentType).join(', ')}
                      >
                        {p.documents.length} document{p.documents.length === 1 ? '' : 's'}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 border-b border-border whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="bg-transparent border-none px-2 py-1 cursor-pointer text-text-muted text-sm rounded transition-all hover:text-primary-600 hover:bg-primary-50"
                        title="Edit policy"
                        onClick={() => onEditPolicy(p)}
                      ><Pencil size={14} /></button>
                      <button
                        className="bg-transparent border-none px-2 py-1 cursor-pointer text-text-muted text-sm rounded transition-all hover:text-primary-600 hover:bg-primary-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        title={p.customer?.email ? `Email ${p.customer.customerName}` : 'No email on file'}
                        disabled={!p.customer?.email}
                        onClick={() => p.customer?.email && navigate(`/email?search=${encodeURIComponent(p.customer.email)}`)}
                      ><Mail size={14} /></button>
                      <button className="bg-transparent border-none px-2 py-1 cursor-pointer text-text-muted text-sm rounded transition-all hover:text-danger-600 hover:bg-danger-50" onClick={() => handleRemovePolicy(p.id)}><X size={14} /></button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : filterCustomer && customerPolicies.length > 0 ? (
        <div className="shrink-0 bg-surface border border-border rounded-xl px-8 py-16 flex flex-col items-center justify-center gap-4 text-center max-md:px-4 max-md:py-10 shadow-card">
          <Search size={42} className="text-neutral-300" />
          <div className="text-lg font-bold text-text">No policies match "{carNumberFilter}"</div>
          <div className="text-sm text-text-muted max-w-[320px]">Try a different car number, or clear the filter.</div>
        </div>
      ) : filterCustomer ? (
        <div className="shrink-0 bg-surface border border-border rounded-xl px-8 py-16 flex flex-col items-center justify-center gap-4 text-center max-md:px-4 max-md:py-10 shadow-card">
          <Layers size={42} className="text-neutral-300 animate-pulse-slow" />
          <div className="text-lg font-bold text-text">No policies added yet</div>
          <div className="text-sm text-text-muted max-w-[320px]">
            {filterCustomer.customerName} has no policies yet. Use the "Add Policy" button above to add one.
          </div>
        </div>
      ) : null}
    </div>
  );
}
