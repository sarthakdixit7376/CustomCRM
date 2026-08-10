import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Layers, Plus, X, UserCircle2, Mail } from 'lucide-react';
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
  glassAndMoreSelected: boolean;
  complementaryVipSelected: boolean;
  amountPaid: string;
}

interface PoliciesAndPlansProps {
  presetCustomer?: { id: string; customerName: string } | null;
  filterCustomer?: { id: string; customerName: string } | null;
}

const EMPTY_FILTERS: FilterState = {
  numberOfPolicies: '', agentName: '', insuranceCompany: '',
  startDate: '', endDate: '', policyType: 'Car', type: 'Mandatory',
  glassAndMoreSelected: false, complementaryVipSelected: false, amountPaid: '',
};

/** Sentinel value for the Car <select> that switches it into "type a new plate number" mode. */
const NEW_CAR_VALUE = '__new__';

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
export default function PoliciesAndPlans({ presetCustomer, filterCustomer }: PoliciesAndPlansProps) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [policies, setPolicies] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [carSelection, setCarSelection] = useState('');
  const [newCarNumber, setNewCarNumber] = useState('');
  const [isSavingCar, setIsSavingCar] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/api/policies`)
      .then(res => setPolicies(res.data))
      .catch(err => console.error("Failed to load policies", err));
  }, []);

  useEffect(() => {
    setCarSelection('');
    setNewCarNumber('');
    if (!presetCustomer) { setCars([]); return; }
    axios.get(`${API_BASE}/api/vehicles/customer/${presetCustomer.id}`)
      .then(res => setCars(res.data))
      .catch(err => console.error("Failed to load vehicles", err));
  }, [presetCustomer]);

  type StringFilterKey = Exclude<keyof FilterState, 'glassAndMoreSelected' | 'complementaryVipSelected'>;

  function handleChange(key: StringFilterKey, value: string) {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'policyType' && value !== 'Car') {
        next.type = '';
        next.glassAndMoreSelected = false; next.complementaryVipSelected = false;
      }
      if (key === 'policyType' && value === 'Car' && !prev.type) next.type = 'Mandatory';
      return next;
    });
    if (key === 'policyType' && value !== 'Car') { setCarSelection(''); setNewCarNumber(''); }
  }

  function handleCheckboxChange(key: 'glassAndMoreSelected' | 'complementaryVipSelected', checked: boolean) {
    setFilters((prev) => ({ ...prev, [key]: checked }));
  }

  function handleReset() { setFilters(EMPTY_FILTERS); setCarSelection(''); setNewCarNumber(''); setAttachmentFile(null); }

  async function handleAdd() {
    if (!presetCustomer) return;
    if (!filters.agentName.trim() && !filters.insuranceCompany.trim()) return;

    setIsAdding(true);
    try {
      let carId: string | null = null;
      if (filters.policyType === 'Car') {
        if (carSelection === NEW_CAR_VALUE) {
          if (!newCarNumber.trim()) { alert('Enter a car number'); setIsAdding(false); return; }
          setIsSavingCar(true);
          const carRes = await axios.post(`${API_BASE}/api/vehicles/customer/${presetCustomer.id}`, { carNumber: newCarNumber.trim() });
          setIsSavingCar(false);
          carId = carRes.data.id;
          setCars((prev) => [carRes.data, ...prev]);
        } else if (carSelection) {
          carId = carSelection;
        }
      }

      const newPolicy = {
        customerId: presetCustomer.id,
        policyNumber: filters.numberOfPolicies,
        agentName: filters.agentName,
        insuranceCompany: filters.insuranceCompany,
        startDate: filters.startDate,
        endDate: filters.endDate,
        policyType: filters.policyType,
        type: filters.type,
        carId,
        glassAndMoreSelected: filters.glassAndMoreSelected,
        complementaryVipSelected: filters.complementaryVipSelected,
        amountPaid: filters.amountPaid,
      };

      const res = await axios.post(`${API_BASE}/api/policies`, newPolicy);
      let createdPolicy = res.data;

      if (attachmentFile) {
        const formData = new FormData();
        formData.append('file', attachmentFile);
        const fileRes = await axios.post(`${API_BASE}/api/policies/${createdPolicy.id}/file`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        createdPolicy = fileRes.data;
      }

      setPolicies((prev) => [createdPolicy, ...prev]);
      setFilters(EMPTY_FILTERS);
      setCarSelection('');
      setNewCarNumber('');
      setAttachmentFile(null);
    } catch (error) {
      console.error("Failed to add policy", error);
      setIsSavingCar(false);
    } finally {
      setIsAdding(false);
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

  const activeFilterCustomer = presetCustomer || filterCustomer;

  const displayedPolicies = activeFilterCustomer
    ? policies.filter((p) => p.customerId === activeFilterCustomer.id)
    : [];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-8 px-8 py-8 animate-fade-in-up max-md:px-4 max-md:py-6 max-md:gap-6">

      {/* Form Card */}
      {presetCustomer ? (
        <div className="shrink-0 bg-surface border border-border rounded-xl overflow-hidden shadow-card">

          {/* Header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-border bg-neutral-50 max-md:px-5 max-md:flex-col max-md:items-stretch max-md:gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-50 border border-primary-100 rounded-lg flex items-center justify-center text-primary-600"><Layers size={18} /></div>
              <div>
                <div className="text-[15px] font-bold text-text">Add Policy / Plan</div>
                <div className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5">
                  <UserCircle2 size={13} /> Adding policy for <span className="font-semibold text-text">{presetCustomer.customerName}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 max-md:justify-end">
              <button className="px-5 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all border border-border bg-surface text-text-muted hover:bg-neutral-100 hover:text-text" onClick={handleReset}>
                Reset
              </button>
              <button className="px-5 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all bg-primary-600 text-white border-none hover:bg-primary-700 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait" onClick={handleAdd} disabled={isAdding}>
                <Plus size={16} strokeWidth={2.5} /> {isAdding ? 'Adding…' : 'Add Policy'}
              </button>
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
                    <label className="text-xs font-medium text-text-muted">Car</label>
                    {carSelection === NEW_CAR_VALUE ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className={inputClass}
                          placeholder="Enter new car number"
                          autoFocus
                          value={newCarNumber}
                          onChange={(e) => setNewCarNumber(e.target.value)}
                          disabled={isSavingCar}
                        />
                        <button type="button" className="text-xs text-text-muted underline whitespace-nowrap cursor-pointer bg-transparent border-none" onClick={() => { setCarSelection(''); setNewCarNumber(''); }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <select className={selectClass} style={selectBg} value={carSelection} onChange={(e) => setCarSelection(e.target.value)}>
                        <option value="">— Select Car —</option>
                        {cars.map((c) => <option key={c.id} value={c.id}>{c.misparRechev || c.id}</option>)}
                        <option value={NEW_CAR_VALUE}>+ Add new car</option>
                      </select>
                    )}
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
              <div className="flex flex-col gap-1.5 min-w-0 col-span-full">
                <label className="text-xs font-medium text-text-muted">Attachment</label>
                <input
                  type="file"
                  className={inputClass}
                  onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
                />
                {attachmentFile && (
                  <span className="text-xs text-text-muted">Selected: {attachmentFile.name}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : filterCustomer ? (
        <div className="shrink-0 bg-surface border border-border rounded-xl px-7 py-5 flex items-center gap-3 shadow-card">
          <UserCircle2 size={20} className="text-primary-600 shrink-0" />
          <div className="text-sm text-text">
            Showing policies for <span className="font-semibold">{filterCustomer.customerName}</span>
          </div>
        </div>
      ) : (
        <div className="shrink-0 bg-surface border border-border rounded-xl px-8 py-10 flex flex-col items-center justify-center gap-3 text-center shadow-card">
          <UserCircle2 size={36} className="text-neutral-300" />
          <div className="text-base font-bold text-text">Select a customer to add a policy</div>
          <div className="text-sm text-text-muted max-w-[360px]">Go to the Customer List tab and click "Add Policy" on a customer's row to add a policy for them.</div>
        </div>
      )}

      {/* Policies List */}
      {displayedPolicies.length > 0 ? (
        <div className="shrink-0 border border-border rounded-xl overflow-x-auto bg-surface shadow-card">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {['#', 'Customer', 'Agent Name', 'Insurance Company', 'Policy Type', 'Type', 'Car Number', 'Start Date', 'End Date', 'Manufacturer', 'Glass and More', 'Complementary + VIP', 'Policy Number', 'Amount Paid', 'File ID', ''].map((h) => (
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
                  <td className={`px-4 py-3 font-medium border-b border-border whitespace-nowrap ${expiryColorClass(p.endDate)}`}>{formatDate(p.startDate)}</td>
                  <td className={`px-4 py-3 font-medium border-b border-border whitespace-nowrap ${expiryColorClass(p.endDate)}`}>{formatDate(p.endDate)}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.manufacturer || '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.glassAndMoreSelected ? 'Yes' : '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.complementaryVipSelected ? 'Yes' : '—'}</td>
                  <td className="px-4 py-3 text-text border-b border-border whitespace-nowrap">{p.policyNumber || '—'}</td>
                  <td className="px-4 py-3 text-text font-medium border-b border-border whitespace-nowrap">{formatCurrency(p.amountPaid)}</td>
                  <td className="px-4 py-3 text-text-muted border-b border-border whitespace-nowrap font-mono">
                    {p.fileUrl ? (
                      <a href={p.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 underline">
                        {p.fileId || 'View file'}
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 border-b border-border whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="bg-transparent border-none px-2 py-1 cursor-pointer text-text-muted text-sm rounded transition-all hover:text-primary-600 hover:bg-primary-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        title={p.customer?.email ? `Email ${p.customer.customerName}` : 'No email on file'}
                        disabled={!p.customer?.email}
                        onClick={() => p.customer?.email && navigate(`/email?search=${encodeURIComponent(p.customer.email)}`)}
                      ><Mail size={14} /></button>
                      <button className="bg-transparent border-none px-2 py-1 cursor-pointer text-text-muted text-sm rounded transition-all hover:text-danger-600 hover:bg-danger-50" onClick={() => handleRemovePolicy(i, p.id)}><X size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="shrink-0 bg-surface border border-border rounded-xl px-8 py-16 flex flex-col items-center justify-center gap-4 text-center max-md:px-4 max-md:py-10 shadow-card">
          <Layers size={42} className="text-neutral-300 animate-pulse-slow" />
          <div className="text-lg font-bold text-text">No policies added yet</div>
          <div className="text-sm text-text-muted max-w-[320px]">
            {activeFilterCustomer ? `${activeFilterCustomer.customerName} has no policies yet.${presetCustomer ? ' Use the form above to add one.' : ''}` : 'Add a policy from the Customer List tab to see it here.'}
          </div>
        </div>
      )}
    </div>
  );
}
