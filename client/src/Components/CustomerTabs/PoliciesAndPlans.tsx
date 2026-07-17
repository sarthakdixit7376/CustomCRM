import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../../config';

/* ───────── Types ───────── */
interface FilterState {
  numberOfPolicies: string;
  agentName: string;
  insuranceCompany: string;
  startDate: string;
  endDate: string;
  typeOfInsurance: string;
}

const EMPTY_FILTERS: FilterState = {
  numberOfPolicies: '', agentName: '', insuranceCompany: '',
  startDate: '', endDate: '', typeOfInsurance: '',
};

const INSURANCE_TYPES = ['Life Insurance', 'Health Insurance', 'Car Insurance', 'Home Insurance', 'Travel Insurance', 'Pension Plan'];

/* ───────── Component ───────── */
export default function PoliciesAndPlans() {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [policies, setPolicies] = useState<any[]>([]);

  useEffect(() => {
    axios.get(`${API_BASE}/api/policies`)
      .then(res => setPolicies(res.data))
      .catch(err => console.error("Failed to load policies", err));
  }, []);

  function handleChange(key: keyof FilterState, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleReset() { setFilters(EMPTY_FILTERS); }

  async function handleAdd() {
    if (!filters.agentName.trim() && !filters.insuranceCompany.trim()) return;

    try {
      const newPolicy = {
        policyNumber: filters.numberOfPolicies,
        agentName: filters.agentName,
        insuranceCompany: filters.insuranceCompany,
        startDate: filters.startDate,
        endDate: filters.endDate,
        type: filters.typeOfInsurance,
        policyType: filters.typeOfInsurance,
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

  const inputClass = "w-full px-3.5 py-2.5 text-sm text-white bg-neutral-950 border border-neutral-800 rounded-lg outline-none transition-all placeholder:text-neutral-600 hover:border-neutral-600 focus:border-white focus:bg-neutral-900";
  const selectClass = `${inputClass} appearance-none cursor-pointer pr-9 bg-no-repeat bg-[right_14px_center] [&>option]:bg-neutral-900 [&>option]:text-white`;
  const selectBg = { backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23666\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E")' };

  return (
    <div className="flex flex-col gap-8 px-8 py-8 animate-fade-in-up max-md:px-4 max-md:py-6 max-md:gap-6">

      {/* Form Card */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-neutral-800 bg-neutral-900 max-md:px-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-neutral-800 border border-neutral-700 rounded-lg flex items-center justify-center text-base">◈</div>
            <div>
              <div className="text-[15px] font-bold text-white">Add Policy / Plan</div>
              <div className="text-xs text-neutral-500 mt-0.5">Fill in the details and add a new insurance policy</div>
            </div>
          </div>
          {policies.length > 0 && (
            <span className="text-xs text-neutral-400 bg-neutral-800 px-3 py-1 rounded-full font-medium">
              {policies.length} {policies.length === 1 ? 'policy' : 'policies'} added
            </span>
          )}
        </div>

        {/* Fields */}
        <div className="p-7 max-md:p-5">
          <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-md:grid-cols-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-400">Policy Number</label>
              <input type="number" className={inputClass} placeholder="e.g. 637/2026" min="0" value={filters.numberOfPolicies} onChange={(e) => handleChange('numberOfPolicies', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-400">Agent Name</label>
              <input type="text" className={inputClass} placeholder="Enter agent name" value={filters.agentName} onChange={(e) => handleChange('agentName', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-400">Insurance Company</label>
              <input type="text" className={inputClass} placeholder="Enter insurance company" value={filters.insuranceCompany} onChange={(e) => handleChange('insuranceCompany', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-400">Start Date</label>
              <input type="date" className={inputClass} value={filters.startDate} onChange={(e) => handleChange('startDate', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-400">End Date</label>
              <input type="date" className={inputClass} value={filters.endDate} onChange={(e) => handleChange('endDate', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-400">Type of Insurance</label>
              <select className={selectClass} style={selectBg} value={filters.typeOfInsurance} onChange={(e) => handleChange('typeOfInsurance', e.target.value)}>
                <option value="">— Select Type —</option>
                {INSURANCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-neutral-800 bg-neutral-900 max-md:px-5">
          <button className="px-5 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all border border-neutral-700 bg-transparent text-neutral-400 hover:bg-neutral-800 hover:text-white" onClick={handleReset}>
            Reset
          </button>
          <button className="px-5 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all bg-white text-black border-none hover:bg-neutral-200" onClick={handleAdd}>
            ➕ Add Policy
          </button>
        </div>
      </div>

      {/* Policies List */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl px-8 py-16 flex flex-col items-center justify-center gap-4 text-center max-md:px-4 max-md:py-10">
        {policies.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="border-b border-neutral-800">
                <tr>
                  {['#', 'Agent Name', 'Insurance Company', 'Type', 'Policies', 'Start Date', 'End Date', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {policies.map((p, i) => (
                  <tr key={i} className="transition-colors even:bg-[#050505] hover:bg-neutral-900">
                    <td className="px-4 py-3 text-neutral-400 border-b border-neutral-800/50">{i + 1}</td>
                    <td className="px-4 py-3 text-neutral-300 border-b border-neutral-800/50">{p.agentName || '—'}</td>
                    <td className="px-4 py-3 text-neutral-300 border-b border-neutral-800/50">{p.insuranceCompany || '—'}</td>
                    <td className="px-4 py-3 text-neutral-300 border-b border-neutral-800/50">{p.typeOfInsurance || p.type || p.policyType || '—'}</td>
                    <td className="px-4 py-3 text-neutral-300 border-b border-neutral-800/50">{p.numberOfPolicies || p.policyNumber || '—'}</td>
                    <td className="px-4 py-3 text-neutral-300 border-b border-neutral-800/50">{p.startDate || '—'}</td>
                    <td className="px-4 py-3 text-neutral-300 border-b border-neutral-800/50">{p.endDate || '—'}</td>
                    <td className="px-4 py-3 border-b border-neutral-800/50">
                      <button className="bg-transparent border-none px-2 py-1 cursor-pointer text-neutral-600 text-sm rounded transition-all hover:text-red-400 hover:bg-red-500/10" onClick={() => handleRemovePolicy(i, p.id)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <div className="text-4xl text-neutral-600 animate-pulse-slow">◈</div>
            <div className="text-lg font-bold text-white">No policies added yet</div>
            <div className="text-sm text-neutral-500 max-w-[320px]">Use the form above to add new insurance policies and plans.</div>
          </>
        )}
      </div>
    </div>
  );
}
