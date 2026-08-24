import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Layers, X, Plus, Save, Trash2 } from 'lucide-react';
import { API_BASE } from '../../config';

/* ───────── Types ───────── */
interface FormState {
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

export interface PolicyFormModalProps {
  isOpen: boolean;
  customer: { id: string; customerName: string } | null;
  /** When set, the modal edits this existing policy instead of creating a new one. */
  policy?: any | null;
  onClose: () => void;
  onSaved: (policy: any) => void;
}

const EMPTY_FORM: FormState = {
  numberOfPolicies: '', agentName: '', insuranceCompany: '',
  startDate: '', endDate: '', policyType: 'Car', type: 'Mandatory',
  glassAndMoreSelected: false, complementaryVipSelected: false, amountPaid: '',
};

/** Sentinel value for the Car <select> that switches it into "type a new plate number" mode. */
const NEW_CAR_VALUE = '__new__';

const POLICY_TYPE_OPTIONS = ['Car', 'Home', 'Travel'];
const TYPE_OPTIONS = ['Mandatory', 'Comprehensive', '3rd Party'];
const INSURANCE_COMPANIES = ['Phoenix', 'Clal', 'Migdal'];

/** Converts an ISO date(time) string to the yyyy-MM-dd shape <input type="date"> expects. */
const toDateInputValue = (value: any): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const formFromPolicy = (policy: any): FormState => ({
  numberOfPolicies: policy.policyNumber || '',
  agentName: policy.agentName || '',
  insuranceCompany: policy.insuranceCompany || '',
  startDate: toDateInputValue(policy.startDate),
  endDate: toDateInputValue(policy.endDate),
  policyType: policy.policyType || 'Car',
  type: policy.type || '',
  glassAndMoreSelected: Boolean(policy.glassAndMoreSelected),
  complementaryVipSelected: Boolean(policy.complementaryVipSelected),
  amountPaid: policy.amountPaid != null ? String(policy.amountPaid) : '',
});

/* ───────── Component ───────── */
export default function PolicyFormModal({ isOpen, customer, policy, onClose, onSaved }: PolicyFormModalProps) {
  const isEditMode = Boolean(policy);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [cars, setCars] = useState<any[]>([]);
  const [carSelection, setCarSelection] = useState('');
  const [newCarNumber, setNewCarNumber] = useState('');
  const [isSavingCar, setIsSavingCar] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm(policy ? formFromPolicy(policy) : EMPTY_FORM);
    setCarSelection(policy?.carId || '');
    setNewCarNumber('');
    setPendingFiles([]);
    setDocuments([]);
  }, [isOpen, policy]);

  useEffect(() => {
    if (!isOpen || !customer) { setCars([]); return; }
    axios.get(`${API_BASE}/api/vehicles/customer/${customer.id}`)
      .then(res => setCars(res.data))
      .catch(err => console.error('Failed to load vehicles', err));
  }, [isOpen, customer]);

  useEffect(() => {
    if (!isOpen || !policy?.id) return;
    axios.get(`${API_BASE}/api/policies/${policy.id}/documents`)
      .then(res => setDocuments(res.data))
      .catch(err => console.error('Failed to load policy documents', err));
  }, [isOpen, policy?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !customer) return null;

  type StringFormKey = Exclude<keyof FormState, 'glassAndMoreSelected' | 'complementaryVipSelected'>;

  function handleChange(key: StringFormKey, value: string) {
    setForm((prev) => {
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
    setForm((prev) => ({ ...prev, [key]: checked }));
  }

  const handleBackdropClick = (e: React.MouseEvent) => { if (e.target === backdropRef.current) onClose(); };

  async function handleDeleteDocument(docId: string) {
    if (!window.confirm('Delete this document?')) return;
    setDeletingDocId(docId);
    try {
      await axios.delete(`${API_BASE}/api/policies/documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (error) {
      console.error('Failed to delete document', error);
    } finally {
      setDeletingDocId(null);
    }
  }

  async function handleSave() {
    if (!customer) return;
    if (!form.agentName.trim() && !form.insuranceCompany.trim()) return;

    setIsSaving(true);
    try {
      let carId: string | null = policy?.carId ?? null;
      if (form.policyType === 'Car') {
        if (carSelection === NEW_CAR_VALUE) {
          if (!newCarNumber.trim()) { alert('Enter a car number'); setIsSaving(false); return; }
          setIsSavingCar(true);
          const carRes = await axios.post(`${API_BASE}/api/vehicles/customer/${customer.id}`, { carNumber: newCarNumber.trim() });
          setIsSavingCar(false);
          carId = carRes.data.id;
          setCars((prev) => [carRes.data, ...prev]);
        } else {
          carId = carSelection || null;
        }
      } else {
        carId = null;
      }

      const payload = {
        customerId: customer.id,
        policyNumber: form.numberOfPolicies,
        agentName: form.agentName,
        insuranceCompany: form.insuranceCompany,
        startDate: form.startDate,
        endDate: form.endDate,
        policyType: form.policyType,
        type: form.type,
        carId,
        glassAndMoreSelected: form.glassAndMoreSelected,
        complementaryVipSelected: form.complementaryVipSelected,
        amountPaid: form.amountPaid,
      };

      let savedPolicy = isEditMode
        ? (await axios.put(`${API_BASE}/api/policies/${policy.id}`, payload)).data
        : (await axios.post(`${API_BASE}/api/policies`, payload)).data;

      const uploadedDocs: any[] = [];
      for (const file of pendingFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const docRes = await axios.post(`${API_BASE}/api/policies/${savedPolicy.id}/file`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedDocs.push(docRes.data);
      }
      if (uploadedDocs.length > 0) {
        savedPolicy = { ...savedPolicy, documents: [...documents, ...uploadedDocs] };
      }

      onSaved(savedPolicy);
      onClose();
    } catch (error) {
      console.error('Failed to save policy', error);
      setIsSavingCar(false);
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass = "w-full px-3.5 py-2.5 text-sm text-text bg-surface border border-border rounded-lg outline-none transition-all placeholder:text-neutral-400 hover:border-neutral-300 focus:border-primary-400 focus:ring-2 focus:ring-primary-100";
  const selectClass = `${inputClass} appearance-none cursor-pointer pr-9 bg-no-repeat bg-[right_14px_center] [&>option]:bg-surface [&>option]:text-text`;
  const selectBg = { backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23888\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E")' };

  return (
    <div className="fixed inset-0 z-[1000] bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-backdrop-fade-in max-sm:items-end max-sm:p-0" ref={backdropRef} onClick={handleBackdropClick}>
      <div className="w-full max-w-[760px] max-h-[90vh] bg-surface border border-border rounded-2xl flex flex-col overflow-hidden shadow-dropdown animate-modal-slide-up max-sm:max-w-full max-sm:max-h-full max-sm:rounded-t-2xl max-sm:rounded-b-none">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-border max-sm:px-5">
          <div className="flex items-center gap-3.5">
            <div className="w-[42px] h-[42px] rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center"><Layers size={20} className="text-primary-600" /></div>
            <div>
              <h2 className="m-0 text-xl font-bold text-text tracking-tight">{isEditMode ? 'Edit Policy / Plan' : 'Add Policy / Plan'}</h2>
              <p className="m-0 mt-0.5 text-[13px] text-text-muted">{isEditMode ? 'Update the policy for' : 'Adding policy for'} <span className="font-semibold text-text">{customer.customerName}</span></p>
            </div>
          </div>
          <button className="w-9 h-9 rounded-lg bg-transparent border border-transparent text-text-muted cursor-pointer flex items-center justify-center transition-all hover:bg-neutral-100 hover:border-border hover:text-text" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-7 max-sm:p-5 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-surface [&::-webkit-scrollbar-thumb]:bg-neutral-300 [&::-webkit-scrollbar-thumb]:rounded">
          <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-md:grid-cols-1">
            <div className="flex flex-col gap-1.5 min-w-0">
              <label className="text-xs font-medium text-text-muted">Policy Number</label>
              <input type="number" className={inputClass} placeholder="e.g. 637/2026" min="0" value={form.numberOfPolicies} onChange={(e) => handleChange('numberOfPolicies', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <label className="text-xs font-medium text-text-muted">Agent Name</label>
              <input type="text" className={inputClass} placeholder="Enter agent name" value={form.agentName} onChange={(e) => handleChange('agentName', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <label className="text-xs font-medium text-text-muted">Insurance Company</label>
              <select className={selectClass} style={selectBg} value={form.insuranceCompany} onChange={(e) => handleChange('insuranceCompany', e.target.value)}>
                <option value="">— Select Company —</option>
                {INSURANCE_COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <label className="text-xs font-medium text-text-muted">Amount Paid</label>
              <input type="number" className={inputClass} placeholder="e.g. 1200" min="0" value={form.amountPaid} onChange={(e) => handleChange('amountPaid', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <label className="text-xs font-medium text-text-muted">Start Date</label>
              <input type="date" className={inputClass} value={form.startDate} onChange={(e) => handleChange('startDate', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <label className="text-xs font-medium text-text-muted">End Date</label>
              <input type="date" className={inputClass} value={form.endDate} onChange={(e) => handleChange('endDate', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <label className="text-xs font-medium text-text-muted">Policy Type</label>
              <select className={selectClass} style={selectBg} value={form.policyType} onChange={(e) => handleChange('policyType', e.target.value)}>
                {POLICY_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {form.policyType === 'Car' && (
              <>
                <div className="flex flex-col gap-1.5 min-w-0">
                  <label className="text-xs font-medium text-text-muted">Type</label>
                  <select className={selectClass} style={selectBg} value={form.type} onChange={(e) => handleChange('type', e.target.value)}>
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
                  <input type="checkbox" id="glassAndMoreSelected" className="w-4 h-4 accent-primary-600 cursor-pointer" checked={form.glassAndMoreSelected} onChange={(e) => handleCheckboxChange('glassAndMoreSelected', e.target.checked)} />
                  <label htmlFor="glassAndMoreSelected" className="text-sm text-text cursor-pointer">Glass and More (₪320)</label>
                </div>
                <div className="flex items-center gap-2 min-w-0 pt-6">
                  <input type="checkbox" id="complementaryVipSelected" className="w-4 h-4 accent-primary-600 cursor-pointer" checked={form.complementaryVipSelected} onChange={(e) => handleCheckboxChange('complementaryVipSelected', e.target.checked)} />
                  <label htmlFor="complementaryVipSelected" className="text-sm text-text cursor-pointer">Complementary + VIP (₪550)</label>
                </div>
              </>
            )}
            <div className="flex flex-col gap-1.5 min-w-0 col-span-full">
              <label className="text-xs font-medium text-text-muted">Documents</label>
              <input
                type="file"
                className={inputClass}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPendingFiles((prev) => [...prev, f]);
                  e.target.value = '';
                }}
              />
              <span className="text-[11px] text-text-muted">Each document is OCR'd and automatically sorted by type — add as many as needed.</span>
              {(documents.length > 0 || pendingFiles.length > 0) && (
                <div className="flex flex-col gap-1.5 mt-1">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between gap-2 px-3 py-2 text-xs bg-neutral-50 border border-border rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium whitespace-nowrap">{doc.documentType}</span>
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 underline truncate">{doc.originalFilename || 'View file'}</a>
                      </div>
                      <button
                        type="button"
                        disabled={deletingDocId === doc.id}
                        className="shrink-0 text-text-muted hover:text-danger-600 bg-transparent border-none cursor-pointer p-1 rounded transition-colors hover:bg-danger-50 disabled:opacity-50 disabled:cursor-wait"
                        title="Delete document"
                        onClick={() => handleDeleteDocument(doc.id)}
                      ><Trash2 size={14} /></button>
                    </div>
                  ))}
                  {pendingFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 text-xs bg-neutral-50 border border-border rounded-lg">
                      <span className="truncate text-text-muted">{f.name} <span className="italic">(will be classified on save)</span></span>
                      <button
                        type="button"
                        className="shrink-0 text-text-muted hover:text-danger-600 bg-transparent border-none cursor-pointer p-1 rounded transition-colors hover:bg-danger-50"
                        title="Remove"
                        onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      ><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-border max-sm:px-5">
          <button className="px-5 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all border border-border bg-surface text-text-muted hover:bg-neutral-50 hover:text-text" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button className="px-5 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all bg-primary-600 text-white border-none hover:bg-primary-700 hover:-translate-y-px hover:shadow-card inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait" onClick={handleSave} disabled={isSaving}>
            {isEditMode ? <Save size={16} strokeWidth={2.5} /> : <Plus size={16} strokeWidth={2.5} />}
            {isSaving ? (isEditMode ? 'Saving…' : 'Adding…') : (isEditMode ? 'Save Changes' : 'Add Policy')}
          </button>
        </div>

      </div>
    </div>
  );
}
