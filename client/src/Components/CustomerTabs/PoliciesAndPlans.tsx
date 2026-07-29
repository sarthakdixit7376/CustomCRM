import { useState, useEffect } from 'react';
import axios from 'axios';
import { Layers, Plus, X } from 'lucide-react';
import { API_BASE } from '../../config';

/* ───────── Types ───────── */
interface FilterState {
  customerId: string;
  numberOfPolicies: string;
  agentName: string;
  insuranceCompany: string;
  startDate: string;
  endDate: string;
  policyType: string;
  type: string;
}

interface CustomerOption {
  id: string;
  customerName: string;
}

const EMPTY_FILTERS: FilterState = {
  customerId: '', numberOfPolicies: '', agentName: '', insuranceCompany: '',
  startDate: '', endDate: '', policyType: 'Car', type: 'Mandatory',
};

const POLICY_TYPE_OPTIONS = ['Car', 'Home', 'Travel'];
const TYPE_OPTIONS = ['Mandatory', 'Comprehensive', '3rd Party'];

/* ───────── Helpers ───────── */
const formatDate = (value: string): string => {
  if (!value || value === '-') return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

/* ───────── Component ───────── */
export default function PoliciesAndPlans() {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [policies, setPolicies] = useState<any[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerError, setCustomerError] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/api/policies`)
      .then(res => setPolicies(res.data))
      .catch(err => console.error("Failed to load policies", err));

    axios.get(`${API_BASE}/api/customers`)
      .then(res => setCustomers(res.data))
      .catch(err => console.error("Failed to load customers", err));
  }, []);

  function handleChange(key: keyof FilterState, value: string) {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'policyType' && value !== 'Car') next.type = '';
      if (key === 'policyType' && value === 'Car' && !prev.type) next.type = 'Mandatory';
      return next;
    });
    if (key === 'customerId' && value) setCustomerError(false);
  }

  function handleReset() { setFilters(EMPTY_FILTERS); }

  async function handleAdd() {
    if (!filters.customerId) {
      setCustomerError(true);
      return;
    }
    if (!filters.agentName.trim() && !filters.insuranceCompany.trim()) return;

    try {
      const newPolicy = {
        customerId: filters.customerId,
        policyNumber: filters.numberOfPolicies,
        agentName: filters.agentName,
        insuranceCompany: filters.insuranceCompany,
        startDate: filters.startDate,
        endDate: filters.endDate,
        policyType: filters.policyType,
        type: filters.type,
      };

      const res = await axios.post(`${API_BASE}/api/policies`, newPolicy);
      setPolicies((prev) => [res.data, ...prev]);
      setFilters(EMPTY_FILTERS);
      setCustomerError(false);
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

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-8 px-8 py-8 animate-fade-in-up max-md:px-4 max-md:py-6 max-md:gap-6">

      {/* Form Card */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-card">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-border bg-neutral-50 max-md:px-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-50 border border-primary-100 rounded-lg flex items-center justify-center text-primary-600"><Layers size={18} /></div>
            <div>
              <div className="text-[15px] font-bold text-text">Add Policy / Plan</div>
              <div className="text-xs text-text-muted mt-0.5">Fill in the details and add a new insurance policy</div>
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="p-7 max-md:p-5">
          <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-md:grid-cols-1">
            <div className="flex flex-col gap-1.5 min-w-0">
              <label className="text-xs font-medium text-text-muted">Customer <span className="text-danger-500">*</span></label>
              <select
                className={`${selectClass} ${customerError ? 'border-danger-500 ring-1 ring-danger-500/20' : ''}`}
                style={selectBg}
                value={filters.customerId}
                onChange={(e) => handleChange('customerId', e.target.value)}
              >
                <option value="">— Select Customer —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.customerName}</option>)}
              </select>
              {customerError && <span className="text-[11px] text-danger-600">Customer is required</span>}
            </div>
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
              <input type="text" className={inputClass} placeholder="Enter insurance company" value={filters.insuranceCompany} onChange={(e) => handleChange('insuranceCompany', e.target.value)} />
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
              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="text-xs font-medium text-text-muted">Type</label>
                <select className={selectClass} style={selectBg} value={filters.type} onChange={(e) => handleChange('type', e.target.value)}>
                  {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
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

      {/* Policies List */}
      {policies.length > 0 ? (
        <div className="border border-border rounded-xl overflow-x-auto hide-scrollbar bg-surface shadow-card">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {['#', 'Customer', 'Agent Name', 'Insurance Company', 'Policy Type', 'Type', 'Policy Number', 'Start Date', 'End Date', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider bg-neutral-50 border-b border-border whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {policies.map((p, i) => (
                <tr key={i} className="transition-colors hover:bg-neutral-50">
                  <td className="px-4 py-3 text-text-muted border-b border-border whitespace-nowrap">{i + 1}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.customer?.customerName || '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.agentName || '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.insuranceCompany || '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.policyType || '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.type || '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.policyNumber || '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{formatDate(p.startDate)}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{formatDate(p.endDate)}</td>
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
          <div className="text-sm text-text-muted max-w-[320px]">Use the form above to add new insurance policies and plans.</div>
        </div>
      )}
    </div>
  );
}
