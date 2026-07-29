import { useState, useEffect } from 'react';
import axios from 'axios';
import { Layers, Plus, X, UserCircle2 } from 'lucide-react';
import { API_BASE } from '../../config';

/* ───────── Types ───────── */
interface FilterState {
  numberOfPolicies: string;
  agentName: string;
  insuranceCompany: string;
  startDate: string;
  endDate: string;
  policyType: string;
  type: string;
  carNumber: string;
  manufacturer: string;
  glassAndMoreSelected: boolean;
  complementaryVipSelected: boolean;
  amountPaid: string;
}

interface PoliciesAndPlansProps {
  presetCustomer?: { id: string; customerName: string } | null;
}

const EMPTY_FILTERS: FilterState = {
  numberOfPolicies: '', agentName: '', insuranceCompany: '',
  startDate: '', endDate: '', policyType: 'Car', type: 'Mandatory', carNumber: '', manufacturer: '',
  glassAndMoreSelected: false, complementaryVipSelected: false, amountPaid: '',
};

const POLICY_TYPE_OPTIONS = ['Car', 'Home', 'Travel'];
const TYPE_OPTIONS = ['Mandatory', 'Comprehensive', '3rd Party'];
const INSURANCE_COMPANIES = ['Phoenix', 'Clal', 'Migdal'];

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
export default function PoliciesAndPlans({ presetCustomer }: PoliciesAndPlansProps) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [policies, setPolicies] = useState<any[]>([]);

  useEffect(() => {
    axios.get(`${API_BASE}/api/policies`)
      .then(res => setPolicies(res.data))
      .catch(err => console.error("Failed to load policies", err));
  }, []);

  type StringFilterKey = Exclude<keyof FilterState, 'glassAndMoreSelected' | 'complementaryVipSelected'>;

  function handleChange(key: StringFilterKey, value: string) {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'policyType' && value !== 'Car') {
        next.type = ''; next.carNumber = ''; next.manufacturer = '';
        next.glassAndMoreSelected = false; next.complementaryVipSelected = false;
      }
      if (key === 'policyType' && value === 'Car' && !prev.type) next.type = 'Mandatory';
      return next;
    });
  }

  function handleCheckboxChange(key: 'glassAndMoreSelected' | 'complementaryVipSelected', checked: boolean) {
    setFilters((prev) => ({ ...prev, [key]: checked }));
  }

  function handleReset() { setFilters(EMPTY_FILTERS); }

  async function handleAdd() {
    if (!presetCustomer) return;
    if (!filters.agentName.trim() && !filters.insuranceCompany.trim()) return;

    try {
      const newPolicy = {
        customerId: presetCustomer.id,
        policyNumber: filters.numberOfPolicies,
        agentName: filters.agentName,
        insuranceCompany: filters.insuranceCompany,
        startDate: filters.startDate,
        endDate: filters.endDate,
        policyType: filters.policyType,
        type: filters.type,
        carNumber: filters.carNumber,
        manufacturer: filters.manufacturer,
        glassAndMoreSelected: filters.glassAndMoreSelected,
        complementaryVipSelected: filters.complementaryVipSelected,
        amountPaid: filters.amountPaid,
      };

      const res = await axios.post(`${API_BASE}/api/policies`, newPolicy);
      setPolicies((prev) => [res.data, ...prev]);
      setFilters(EMPTY_FILTERS);
    } catch (error) {
      console.error("Failed to add policy", error);
    }
  }

  async function handleRemovePolicy(index: number, policyId?: string) {
    if (!policyId) {
       setPolicies((prev) => prev.filter((_, i) => i !== index));
       return;
    }

    try {
      await axios.delete(`${API_BASE}/api/policies/${policyId}`);
      setPolicies((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Failed to delete policy", error);
    }
  }

  const inputClass = "w-full px-3.5 py-2.5 text-sm text-text bg-surface border border-border rounded-lg outline-none transition-all placeholder:text-neutral-400 hover:border-neutral-300 focus:border-primary-400 focus:ring-2 focus:ring-primary-100";
  const selectClass = `${inputClass} appearance-none cursor-pointer pr-9 bg-no-repeat bg-[right_14px_center] [&>option]:bg-surface [&>option]:text-text`;
  const selectBg = { backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23888\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E")' };

  const displayedPolicies = presetCustomer
    ? policies.filter((p) => p.customerId === presetCustomer.id)
    : policies;

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-8 px-8 py-8 animate-fade-in-up max-md:px-4 max-md:py-6 max-md:gap-6">

      {/* Form Card */}
      {presetCustomer ? (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-card">

          {/* Header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-border bg-neutral-50 max-md:px-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-50 border border-primary-100 rounded-lg flex items-center justify-center text-primary-600"><Layers size={18} /></div>
              <div>
                <div className="text-[15px] font-bold text-text">Add Policy / Plan</div>
                <div className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5">
                  <UserCircle2 size={13} /> Adding policy for <span className="font-semibold text-text">{presetCustomer.customerName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="p-7 max-md:p-5">
            <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-md:grid-cols-1">
              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="text-xs font-medium text-text-muted">Policy Number</label>
                <input type="number" className={inputClass} placeholder="e.g. 637/2026" min="0" value={filters.numberOfPolicies} onChange={(e) => handleChange('numberOfPolicies', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="text-xs font-medium text-text-muted">Agent Name</label>
                <input type="text" className={inputClass} placeholder="Enter agent name" value={filters.agentName} onChange={(e) => handleChange('agentName', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="text-xs font-medium text-text-muted">Insurance Company</label>
                <select className={selectClass} style={selectBg} value={filters.insuranceCompany} onChange={(e) => handleChange('insuranceCompany', e.target.value)}>
                  <option value="">— Select Company —</option>
                  {INSURANCE_COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="text-xs font-medium text-text-muted">Amount Paid</label>
                <input type="number" className={inputClass} placeholder="e.g. 1200" min="0" value={filters.amountPaid} onChange={(e) => handleChange('amountPaid', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="text-xs font-medium text-text-muted">Start Date</label>
                <input type="date" className={inputClass} value={filters.startDate} onChange={(e) => handleChange('startDate', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="text-xs font-medium text-text-muted">End Date</label>
                <input type="date" className={inputClass} value={filters.endDate} onChange={(e) => handleChange('endDate', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="text-xs font-medium text-text-muted">Policy Type</label>
                <select className={selectClass} style={selectBg} value={filters.policyType} onChange={(e) => handleChange('policyType', e.target.value)}>
                  {POLICY_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {filters.policyType === 'Car' && (
                <>
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <label className="text-xs font-medium text-text-muted">Type</label>
                    <select className={selectClass} style={selectBg} value={filters.type} onChange={(e) => handleChange('type', e.target.value)}>
                      {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <label className="text-xs font-medium text-text-muted">Car Number</label>
                    <input type="text" className={inputClass} placeholder="Enter car number" value={filters.carNumber} onChange={(e) => handleChange('carNumber', e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <label className="text-xs font-medium text-text-muted">Manufacturer</label>
                    <input type="text" className={inputClass} placeholder="Enter manufacturer" value={filters.manufacturer} onChange={(e) => handleChange('manufacturer', e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2 min-w-0 pt-6">
                    <input type="checkbox" id="glassAndMoreSelected" className="w-4 h-4 accent-primary-600 cursor-pointer" checked={filters.glassAndMoreSelected} onChange={(e) => handleCheckboxChange('glassAndMoreSelected', e.target.checked)} />
                    <label htmlFor="glassAndMoreSelected" className="text-sm text-text cursor-pointer">Glass and More (₪320)</label>
                  </div>
                  <div className="flex items-center gap-2 min-w-0 pt-6">
                    <input type="checkbox" id="complementaryVipSelected" className="w-4 h-4 accent-primary-600 cursor-pointer" checked={filters.complementaryVipSelected} onChange={(e) => handleCheckboxChange('complementaryVipSelected', e.target.checked)} />
                    <label htmlFor="complementaryVipSelected" className="text-sm text-text cursor-pointer">Complementary + VIP (₪550)</label>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-border bg-neutral-50 max-md:px-5">
            <button className="px-5 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all border border-border bg-surface text-text-muted hover:bg-neutral-100 hover:text-text" onClick={handleReset}>
              Reset
            </button>
            <button className="px-5 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all bg-primary-600 text-white border-none hover:bg-primary-700 inline-flex items-center gap-2" onClick={handleAdd}>
              <Plus size={16} strokeWidth={2.5} /> Add Policy
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl px-8 py-10 flex flex-col items-center justify-center gap-3 text-center shadow-card">
          <UserCircle2 size={36} className="text-neutral-300" />
          <div className="text-base font-bold text-text">Select a customer to add a policy</div>
          <div className="text-sm text-text-muted max-w-[360px]">Go to the Customer List tab and click "Add Policy" on a customer's row to add a policy for them.</div>
        </div>
      )}

      {/* Policies List */}
      {displayedPolicies.length > 0 ? (
        <div className="border border-border rounded-xl overflow-x-auto hide-scrollbar bg-surface shadow-card">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {['#', 'Customer', 'Agent Name', 'Insurance Company', 'Policy Type', 'Type', 'Car Number', 'Manufacturer', 'Glass and More', 'Complementary + VIP', 'Policy Number', 'Amount Paid', 'Start Date', 'End Date', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider bg-neutral-50 border-b border-border whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedPolicies.map((p, i) => (
                <tr key={i} className="transition-colors hover:bg-neutral-50">
                  <td className="px-4 py-3 text-text-muted border-b border-border whitespace-nowrap">{i + 1}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.customer?.customerName || '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.agentName || '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.insuranceCompany || '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.policyType || '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.type || '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.carNumber || '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.manufacturer || '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.glassAndMoreSelected ? 'Yes' : '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.complementaryVipSelected ? 'Yes' : '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.policyNumber || '—'}</td>
                  <td className="px-4 py-3 text-text font-medium border-b border-border whitespace-nowrap">{formatCurrency(p.amountPaid)}</td>
                  <td className={`px-4 py-3 font-medium border-b border-border whitespace-nowrap ${expiryColorClass(p.endDate)}`}>{formatDate(p.startDate)}</td>
                  <td className={`px-4 py-3 font-medium border-b border-border whitespace-nowrap ${expiryColorClass(p.endDate)}`}>{formatDate(p.endDate)}</td>
                  <td className="px-4 py-3 border-b border-border whitespace-nowrap text-right">
                    <button className="bg-transparent border-none px-2 py-1 cursor-pointer text-text-muted text-sm rounded transition-all hover:text-danger-600 hover:bg-danger-50" onClick={() => handleRemovePolicy(i, p.id)}><X size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl px-8 py-16 flex flex-col items-center justify-center gap-4 text-center max-md:px-4 max-md:py-10 shadow-card">
          <Layers size={42} className="text-neutral-300 animate-pulse-slow" />
          <div className="text-lg font-bold text-text">No policies added yet</div>
          <div className="text-sm text-text-muted max-w-[320px]">
            {presetCustomer ? `${presetCustomer.customerName} has no policies yet. Use the form above to add one.` : 'Add a policy from the Customer List tab to see it here.'}
          </div>
        </div>
      )}
    </div>
  );
}
