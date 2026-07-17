import { useState, useEffect, useRef } from 'react';

/* ───────── Types ───────── */
export interface CustomerFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  policyNumber: string;
  policyType: string;
  insuranceType: string;
  startDate: string;
  endDate: string;
  email: string;
  phone: string;
  mobile: string;
  address: string;
  city: string;
  insuranceCompany: string;
  purchaseType: string;
  notes: string;
}

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => void;
}

const INITIAL_FORM: CustomerFormData = {
  firstName: '', lastName: '', dateOfBirth: '', gender: '',
  policyNumber: '', policyType: 'Mandatory', insuranceType: 'Car', startDate: '', endDate: '', email: '', phone: '',
  mobile: '', address: '', city: '', insuranceCompany: '', purchaseType: 'Private', notes: '',
};

/* ───────── Component ───────── */
export default function NewCustomerModal({ isOpen, onClose, onSubmit }: NewCustomerModalProps) {
  const [form, setForm] = useState<CustomerFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});
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

  const handleChange = (field: keyof CustomerFormData, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof CustomerFormData, string>> = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.policyNumber.trim()) e.policyNumber = 'Required';
    if (!form.phone.trim() && !form.mobile.trim()) e.phone = 'At least one phone required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => { if (validate()) onSubmit(form); };
  const handleBackdropClick = (e: React.MouseEvent) => { if (e.target === backdropRef.current) onClose(); };

  const inputBase = "w-full px-3.5 py-2.5 text-sm text-white bg-neutral-950 border rounded-lg outline-none transition-all placeholder:text-neutral-600 hover:border-neutral-600";
  const inputOk = "border-neutral-800 focus:border-white focus:bg-neutral-900";
  const inputErr = "border-red-600 ring-1 ring-red-600/20";
  const selectClass = `${inputBase} ${inputOk} appearance-none cursor-pointer pr-9 bg-no-repeat bg-[right_14px_center] [&>option]:bg-neutral-900 [&>option]:text-white`;
  const selectBg = { backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23666\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E")' };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-backdrop-fade-in max-sm:items-end max-sm:p-0" ref={backdropRef} onClick={handleBackdropClick}>
      <div className="w-full max-w-[680px] max-h-[90vh] bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-modal-slide-up max-sm:max-w-full max-sm:max-h-full max-sm:rounded-t-2xl max-sm:rounded-b-none">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-neutral-800 max-sm:px-5">
          <div className="flex items-center gap-3.5">
            <div className="w-[42px] h-[42px] rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xl">👤</div>
            <div>
              <h2 className="m-0 text-xl font-bold text-white tracking-tight">New Customer</h2>
              <p className="m-0 mt-0.5 text-[13px] text-neutral-500">Fill in the customer details below</p>
            </div>
          </div>
          <button className="w-9 h-9 rounded-lg bg-transparent border border-transparent text-neutral-500 text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-neutral-800 hover:border-neutral-700 hover:text-white" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-7 max-sm:p-5 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-neutral-950 [&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:rounded">

          {/* ── Personal Information ── */}
          <div className="mb-7">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4 pb-2.5 border-b border-neutral-800/50">
              <span className="text-sm">🪪</span> Personal Information
            </div>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-400">First Name <span className="text-red-500">*</span></label>
                <input type="text" className={`${inputBase} ${errors.firstName ? inputErr : inputOk}`} placeholder="Enter first name" value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} />
                {errors.firstName && <span className="text-[11px] text-red-500 flex items-center gap-1">⚠ {errors.firstName}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-400">Last Name <span className="text-red-500">*</span></label>
                <input type="text" className={`${inputBase} ${errors.lastName ? inputErr : inputOk}`} placeholder="Enter last name" value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} />
                {errors.lastName && <span className="text-[11px] text-red-500 flex items-center gap-1">⚠ {errors.lastName}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-400">Date of Birth</label>
                <input type="date" className={`${inputBase} ${inputOk}`} value={form.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-400">Gender</label>
                <select className={selectClass} style={selectBg} value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-400">Purchase Type</label>
                <select className={selectClass} style={selectBg} value={form.purchaseType} onChange={(e) => handleChange('purchaseType', e.target.value)}>
                  <option value="Private">Private</option>
                  <option value="Business">Business</option>
                  <option value="Corporate">Corporate</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Policy Details ── */}
          <div className="mb-7">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4 pb-2.5 border-b border-neutral-800/50">
              <span className="text-sm">📋</span> Policy Details
            </div>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div className="flex flex-col gap-1.5 col-span-full">
                <label className="text-xs font-medium text-neutral-400">Policy Number <span className="text-red-500">*</span></label>
                <input type="text" className={`${inputBase} ${errors.policyNumber ? inputErr : inputOk}`} placeholder="Enter policy number" value={form.policyNumber} onChange={(e) => handleChange('policyNumber', e.target.value)} />
                {errors.policyNumber && <span className="text-[11px] text-red-500 flex items-center gap-1">⚠ {errors.policyNumber}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-400">Policy Type <span className="text-red-500">*</span></label>
                <select className={selectClass} style={selectBg} value={form.policyType} onChange={(e) => handleChange('policyType', e.target.value)}>
                  <option value="Mandatory">Mandatory</option>
                  <option value="Comprehensive">Comprehensive</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-400">Type <span className="text-red-500">*</span></label>
                <select className={selectClass} style={selectBg} value={form.insuranceType} onChange={(e) => handleChange('insuranceType', e.target.value)}>
                  <option value="Car">Car</option>
                  <option value="Life">Life</option>
                  <option value="Property">Property</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-400">Start Date</label>
                <input type="date" className={`${inputBase} ${inputOk}`} value={form.startDate} onChange={(e) => handleChange('startDate', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-400">End Date</label>
                <input type="date" className={`${inputBase} ${inputOk}`} value={form.endDate} onChange={(e) => handleChange('endDate', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── Contact Information ── */}
          <div className="mb-7">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4 pb-2.5 border-b border-neutral-800/50">
              <span className="text-sm">📞</span> Contact Information
            </div>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-400">Phone <span className="text-red-500">*</span></label>
                <input type="tel" className={`${inputBase} ${errors.phone ? inputErr : inputOk}`} placeholder="e.g., 052-8844475" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                {errors.phone && <span className="text-[11px] text-red-500 flex items-center gap-1">⚠ {errors.phone}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-400">Mobile</label>
                <input type="tel" className={`${inputBase} ${inputOk}`} placeholder="e.g., 054-3952229" value={form.mobile} onChange={(e) => handleChange('mobile', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5 col-span-full">
                <label className="text-xs font-medium text-neutral-400">Email</label>
                <input type="email" className={`${inputBase} ${inputOk}`} placeholder="customer@example.com" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── Address ── */}
          <div className="mb-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4 pb-2.5 border-b border-neutral-800/50">
              <span className="text-sm">📍</span> Address
            </div>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div className="flex flex-col gap-1.5 col-span-full">
                <label className="text-xs font-medium text-neutral-400">Street Address</label>
                <input type="text" className={`${inputBase} ${inputOk}`} placeholder="Enter street address" value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-400">City</label>
                <input type="text" className={`${inputBase} ${inputOk}`} placeholder="Enter city" value={form.city} onChange={(e) => handleChange('city', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-400">Insurance Company</label>
                <input type="text" className={`${inputBase} ${inputOk}`} placeholder="Company name" value={form.insuranceCompany} onChange={(e) => handleChange('insuranceCompany', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-neutral-800 max-sm:px-5">
          <button className="px-5 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all border border-neutral-700 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white" onClick={onClose}>
            Cancel
          </button>
          <button className="px-5 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all bg-white text-black border-none hover:bg-neutral-200 hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(255,255,255,0.1)]" onClick={handleSubmit}>
            + Add Customer
          </button>
        </div>

      </div>
    </div>
  );
}
