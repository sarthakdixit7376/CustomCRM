import { useState, useEffect, useRef, useCallback } from 'react';

/* ───────── Field Configuration ───────── */
export interface LeadFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'select';
  placeholder?: string;
  required?: boolean;
  colSpan?: 'full' | 'half';
  options?: { value: string; label: string }[];
}

/** The fields for the "Create New Lead" form. */
export const LEAD_FORM_FIELDS: LeadFieldConfig[] = [
  {
    key: 'lead_name',
    label: 'Lead Name',
    type: 'text',
    placeholder: 'Enter lead name',
    required: true,
  },
  {
    key: 'phone_number',
    label: 'Phone Number',
    type: 'text',
    placeholder: 'e.g., 052-1234567',
    required: true,
  },
  {
    key: 'vehicle_number',
    label: 'Vehicle Number',
    type: 'text',
    placeholder: 'e.g., 1234567',
    required: true,
    colSpan: 'full',
  },
  {
    key: 'date_of_birth',
    label: 'Date of Birth',
    type: 'date',
    required: false,
  },
  {
    key: 'age',
    label: 'Age',
    type: 'number',
    placeholder: 'Calculated from date of birth',
    required: true,
  },
  {
    key: 'year_of_license_issued',
    label: 'Year of License Issued',
    type: 'number',
    placeholder: 'e.g., 2018',
    required: false,
  },
  {
    key: 'interested_in',
    label: 'Interested In',
    type: 'select',
    required: false,
    options: [
      { value: 'CARS', label: 'Cars' },
      { value: 'HOME', label: 'Home' },
      { value: 'BUSINESS', label: 'Business' },
      { value: 'TRAVEL', label: 'Travel' },
      { value: 'HEALTH', label: 'Health' },
      { value: 'OTHER', label: 'Other' },
    ],
  },
];

/* ───────── Types ───────── */
export type LeadFormData = Record<string, string>;

export interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LeadFormData) => void | Promise<void>;
  isSubmitting?: boolean;
}

/** Calculates whole years elapsed since a YYYY-MM-DD date of birth. */
function calculateAge(dateOfBirth: string): string {
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return '';

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;

  return age >= 0 ? String(age) : '';
}

/* ───────── Reusable FormField ───────── */
interface FormFieldProps {
  field: LeadFieldConfig;
  value: string;
  error?: string;
  onChange: (key: string, value: string) => void;
  inputClassName: string;
  errorClassName: string;
  readOnly?: boolean;
}

function FormField({ field, value, error, onChange, inputClassName, errorClassName, readOnly }: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${field.colSpan === 'full' ? 'col-span-full' : ''}`}>
      <label className="text-xs font-medium text-text-muted">
        {field.label}
        {field.required && <span className="text-danger-500 ml-0.5">*</span>}
      </label>
      {field.type === 'select' ? (
        <select
          className={inputClassName}
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
        >
          <option value="">Select an option</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type}
          className={`${inputClassName} ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
          placeholder={field.placeholder}
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      )}
      {error && (
        <span className={errorClassName}>⚠ {error}</span>
      )}
    </div>
  );
}

/* ───────── Modal Component ───────── */
export default function CreateLeadModal({ isOpen, onClose, onSubmit, isSubmitting = false }: CreateLeadModalProps) {
  const [form, setForm] = useState<LeadFormData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const backdropRef = useRef<HTMLDivElement>(null);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setForm({});
      setErrors({});
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleChange = useCallback((key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'date_of_birth' ? { age: calculateAge(value) } : {}),
    }));
    setErrors((prev) => {
      const keysToClear = key === 'date_of_birth' ? [key, 'age'] : [key];
      if (!keysToClear.some((k) => prev[k])) return prev;
      const next = { ...prev };
      for (const k of keysToClear) delete next[k];
      return next;
    });
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const field of LEAD_FORM_FIELDS) {
      if (field.required && !form[field.key]?.trim()) {
        newErrors[field.key] = `${field.label} is required`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate() && !isSubmitting) {
      onSubmit(form);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  if (!isOpen) return null;

  /* Styling tokens — matches NewCustomerModal exactly */
  const inputBase = "w-full px-3.5 py-2.5 text-sm text-text bg-surface border rounded-lg outline-none transition-all placeholder:text-neutral-400 hover:border-neutral-300";
  const inputOk = "border-border focus:border-primary-400 focus:ring-2 focus:ring-primary-100";
  const inputErr = "border-danger-500 ring-1 ring-danger-500/20";
  const errorText = "text-[11px] text-danger-600 flex items-center gap-1";

  return (
    <div
      className="fixed inset-0 z-[1000] bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-backdrop-fade-in max-sm:items-end max-sm:p-0"
      ref={backdropRef}
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-[540px] max-h-[90vh] bg-surface border border-border rounded-2xl flex flex-col overflow-hidden shadow-dropdown animate-modal-slide-up max-sm:max-w-full max-sm:max-h-full max-sm:rounded-t-2xl max-sm:rounded-b-none">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-border max-sm:px-5">
          <div className="flex items-center gap-3.5">
            <div className="w-[42px] h-[42px] rounded-xl bg-success-50 border border-success-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success-600">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <div>
              <h2 className="m-0 text-xl font-bold text-text tracking-tight">Create New Lead</h2>
              <p className="m-0 mt-0.5 text-[13px] text-text-muted">Enter the lead details below</p>
            </div>
          </div>
          <button
            className="w-9 h-9 rounded-lg bg-transparent border border-transparent text-text-muted text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-neutral-100 hover:border-border hover:text-text"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-7 max-sm:p-5 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-surface [&::-webkit-scrollbar-thumb]:bg-neutral-300 [&::-webkit-scrollbar-thumb]:rounded">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider mb-4 pb-2.5 border-b border-border">
            <span className="text-sm">🚗</span> Lead Information
          </div>
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            {LEAD_FORM_FIELDS.map((field) => (
              <FormField
                key={field.key}
                field={field}
                value={form[field.key] || ''}
                error={errors[field.key]}
                onChange={handleChange}
                inputClassName={`${inputBase} ${errors[field.key] ? inputErr : inputOk}`}
                errorClassName={errorText}
                readOnly={field.key === 'age'}
              />
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-border max-sm:px-5">
          <button
            className="px-5 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all border border-border bg-surface text-text-muted hover:bg-neutral-50 hover:text-text disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="px-5 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all bg-primary-600 text-white border-none hover:bg-primary-700 hover:-translate-y-px hover:shadow-card disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating…
              </>
            ) : (
              '+ Create Lead'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
