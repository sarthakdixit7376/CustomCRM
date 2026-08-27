import { useState, useEffect, useRef } from 'react';
import { UserCheck, X, ClipboardList, AlertTriangle } from 'lucide-react';

/* ───────── Types ───────── */
export type InsuranceFor = 'Car' | 'Home' | 'Travel';

export interface ConvertToCustomerFormData {
  policyNumber: string;
  policyType: InsuranceFor;
  type: string;
  insuranceCompany: string;
  startDate: string;
  endDate: string;
  gender: string;
  agentName: string;
  purchaseType: string;
  email: string;
}

interface ConvertToCustomerModalProps {
  isOpen: boolean;
  leadName?: string;
  onClose: () => void;
  onSubmit: (data: ConvertToCustomerFormData) => void;
  isSubmitting?: boolean;
}

const INSURANCE_FOR_OPTIONS: InsuranceFor[] = ['Car', 'Home', 'Travel'];
const CAR_INSURANCE_TYPES = ['Mandatory', '3rd Party', 'Comprehensive'];
const INSURANCE_COMPANIES = ['Phoenix', 'Clal', 'Migdal', 'Ayalon'];

const INITIAL_FORM: ConvertToCustomerFormData = {
  policyNumber: '',
  policyType: 'Car',
  type: 'Mandatory',
  insuranceCompany: '',
  startDate: '',
  endDate: '',
  gender: '',
  agentName: '',
  purchaseType: 'Private',
  email: '',
};

/* ───────── Component ───────── */
export default function ConvertToCustomerModal({ isOpen, leadName, onClose, onSubmit, isSubmitting }: ConvertToCustomerModalProps) {
  const [form, setForm] = useState<ConvertToCustomerFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ConvertToCustomerFormData, string>>>({});
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (isOpen) { setForm(INITIAL_FORM); setErrors({}); } }, [isOpen]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof ConvertToCustomerFormData, value: string) => {
    setForm((p) => {
      const next = { ...p, [field]: value };
      if (field === 'policyType' && value !== 'Car') next.type = '';
      if (field === 'policyType' && value === 'Car' && !p.type) next.type = 'Mandatory';
      return next;
    });
    if (errors[field]) setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof ConvertToCustomerFormData, string>> = {};
    if (!form.policyNumber.trim()) e.policyNumber = 'Required';
    if (!form.insuranceCompany.trim()) e.insuranceCompany = 'Required';
    if (!form.startDate) e.startDate = 'Required';
    if (!form.endDate) e.endDate = 'Required';
    if (form.policyType === 'Car' && !form.type) e.type = 'Required';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => { if (validate()) onSubmit(form); };
  const handleBackdropClick = (e: React.MouseEvent) => { if (e.target === backdropRef.current) onClose(); };

  const inputBase = "w-full px-3.5 py-2.5 text-sm text-text bg-surface border rounded-lg outline-none transition-all placeholder:text-neutral-400 hover:border-neutral-300";
  const inputOk = "border-border focus:border-primary-400 focus:ring-2 focus:ring-primary-100";
  const inputErr = "border-danger-500 ring-1 ring-danger-500/20";
  const selectClass = `${inputBase} ${inputOk} appearance-none cursor-pointer pr-9 bg-no-repeat bg-[right_14px_center] [&>option]:bg-surface [&>option]:text-text`;
  const selectBg = { backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23888\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E")' };

  return (
    <div className="fixed inset-0 z-[1000] bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-backdrop-fade-in max-sm:items-end max-sm:p-0" ref={backdropRef} onClick={handleBackdropClick}>
      <div className="w-full max-w-[560px] max-h-[90vh] bg-surface border border-border rounded-2xl flex flex-col overflow-hidden shadow-dropdown animate-modal-slide-up max-sm:max-w-full max-sm:max-h-full max-sm:rounded-t-2xl max-sm:rounded-b-none">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-border max-sm:px-5">
          <div className="flex items-center gap-3.5">
            <div className="w-[42px] h-[42px] rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center"><UserCheck size={20} className="text-primary-600" /></div>
            <div>
              <h2 className="m-0 text-xl font-bold text-text tracking-tight">Transfer to Customer</h2>
              <p className="m-0 mt-0.5 text-[13px] text-text-muted">{leadName ? `Create the policy for ${leadName}` : 'Create the policy details below'}</p>
            </div>
          </div>
          <button className="w-9 h-9 rounded-lg bg-transparent border border-transparent text-text-muted cursor-pointer flex items-center justify-center transition-all hover:bg-neutral-100 hover:border-border hover:text-text" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-7 max-sm:p-5 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-surface [&::-webkit-scrollbar-thumb]:bg-neutral-300 [&::-webkit-scrollbar-thumb]:rounded">
          <div className="mb-7">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider mb-4 pb-2.5 border-b border-border">
              <UserCheck size={14} /> Customer Details
            </div>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">Gender</label>
                <select className={selectClass} style={selectBg} value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">Purchase Type</label>
                <select className={selectClass} style={selectBg} value={form.purchaseType} onChange={(e) => handleChange('purchaseType', e.target.value)}>
                  <option value="Private">Private</option>
                  <option value="Business">Business</option>
                  <option value="Corporate">Corporate</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">Agent Name</label>
                <input type="text" className={`${inputBase} ${inputOk}`} placeholder="Enter agent name" value={form.agentName} onChange={(e) => handleChange('agentName', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">Email</label>
                <input type="email" className={`${inputBase} ${errors.email ? inputErr : inputOk}`} placeholder="customer@example.com" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
                {errors.email && <span className="text-[11px] text-danger-600 flex items-center gap-1"><AlertTriangle size={12} /> {errors.email}</span>}
              </div>
            </div>
          </div>

          <div className="mb-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider mb-4 pb-2.5 border-b border-border">
              <ClipboardList size={14} /> Policy Details
            </div>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div className="flex flex-col gap-1.5 col-span-full">
                <label className="text-xs font-medium text-text-muted">Insurance Number <span className="text-danger-500">*</span></label>
                <input type="text" className={`${inputBase} ${errors.policyNumber ? inputErr : inputOk}`} placeholder="Enter insurance number" value={form.policyNumber} onChange={(e) => handleChange('policyNumber', e.target.value)} />
                {errors.policyNumber && <span className="text-[11px] text-danger-600 flex items-center gap-1"><AlertTriangle size={12} /> {errors.policyNumber}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">Insurance For <span className="text-danger-500">*</span></label>
                <select className={selectClass} style={selectBg} value={form.policyType} onChange={(e) => handleChange('policyType', e.target.value)}>
                  {INSURANCE_FOR_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {form.policyType === 'Car' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-muted">Insurance Type <span className="text-danger-500">*</span></label>
                  <select className={`${selectClass} ${errors.type ? inputErr : ''}`} style={selectBg} value={form.type} onChange={(e) => handleChange('type', e.target.value)}>
                    {CAR_INSURANCE_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                  {errors.type && <span className="text-[11px] text-danger-600 flex items-center gap-1"><AlertTriangle size={12} /> {errors.type}</span>}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">Policy Start Date <span className="text-danger-500">*</span></label>
                <input type="date" className={`${inputBase} ${errors.startDate ? inputErr : inputOk}`} value={form.startDate} onChange={(e) => handleChange('startDate', e.target.value)} />
                {errors.startDate && <span className="text-[11px] text-danger-600 flex items-center gap-1"><AlertTriangle size={12} /> {errors.startDate}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">Policy End Date <span className="text-danger-500">*</span></label>
                <input type="date" className={`${inputBase} ${errors.endDate ? inputErr : inputOk}`} value={form.endDate} onChange={(e) => handleChange('endDate', e.target.value)} />
                {errors.endDate && <span className="text-[11px] text-danger-600 flex items-center gap-1"><AlertTriangle size={12} /> {errors.endDate}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">Insurance Company <span className="text-danger-500">*</span></label>
                <select className={`${selectClass} ${errors.insuranceCompany ? inputErr : ''}`} style={selectBg} value={form.insuranceCompany} onChange={(e) => handleChange('insuranceCompany', e.target.value)}>
                  <option value="">— Select Company —</option>
                  {INSURANCE_COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.insuranceCompany && <span className="text-[11px] text-danger-600 flex items-center gap-1"><AlertTriangle size={12} /> {errors.insuranceCompany}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-border max-sm:px-5">
          <button className="px-5 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all border border-border bg-surface text-text-muted hover:bg-neutral-50 hover:text-text" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="px-5 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all bg-primary-600 text-white border-none hover:bg-primary-700 hover:-translate-y-px hover:shadow-card inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait" onClick={handleSubmit} disabled={isSubmitting}>
            <UserCheck size={16} strokeWidth={2.5} /> {isSubmitting ? 'Transferring…' : 'Transfer to Customer'}
          </button>
        </div>

      </div>
    </div>
  );
}
