import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Pencil, Printer, Phone, Smartphone, User } from 'lucide-react';
import type { LeadRow } from './Lead';
import { API_BASE } from '../../config';

/* ───────── Default Data ───────── */
const DEFAULT_CUSTOMER = {
  id: '',
  name: '',
  avatar: '👤',
  identity: [
    { label: 'ID', value: '' },
    { label: 'Date of Birth', value: '' },
    { label: 'Gender', value: '' },
    { label: 'No. of Policies', value: '' },
    { label: 'Insurance Agent', value: '' },
    { label: 'Agent Name', value: '' },
    { label: 'Purchase Type', value: '' },
  ],
  extras: {
    uniqueId: '',
    pathNumber: '',
    healthFund: '',
    employer: '',
    signedGoodFaith: 'No',
    noFixedAddress: false,
    memberId: '',
    workPlace: '',
    carBrand: '',
  },
  contacts: [
    { icon: '📱', value: '', label: 'Mobile', type: 'mobile' },
    { icon: '📞', value: '', label: 'Phone', type: 'phone' },
  ],
};

/* ───────── Component ───────── */
export interface CustomerCardProps {
  customer?: any | null; // using any to accept full db object
  lead?: LeadRow | null;
}

export default function CustomerCard({ customer, lead }: CustomerCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const getInitialData = (cust: any | null | undefined, ld: LeadRow | null | undefined) => {
    const displayName = cust?.customerName || ld?.leadName || DEFAULT_CUSTOMER.name;
    const insuranceAgent = cust?.insuranceAgent || cust?.insuranceCompany || DEFAULT_CUSTOMER.identity.find((f) => f.label === 'Insurance Agent')?.value || '';

    let newContacts = cust?.contacts?.length ? cust.contacts.map((c: any) => ({
      icon: c.icon || '📱', value: c.value, label: c.label || displayName || (c.type === 'phone' ? 'Phone' : 'Mobile'), type: c.type
    })) : DEFAULT_CUSTOMER.contacts.map(c => ({ ...c }));

    if (ld?.phoneNumber && !cust?.contacts?.length) {
      newContacts[0] = { ...newContacts[0], value: ld.phoneNumber, label: displayName || 'Mobile' };
    }

    const newExtras = { ...DEFAULT_CUSTOMER.extras };
    if (ld) {
      newExtras.carBrand = ld.degemNm || '';
      newExtras.uniqueId = ld.horaatRishum || '';
      newExtras.pathNumber = ld.misparRechev || '';
    }
    if (cust) {
      newExtras.uniqueId = cust.uniqueId || '';
      newExtras.pathNumber = cust.pathNumber || '';
      newExtras.healthFund = cust.healthFund || '';
      newExtras.employer = cust.employer || '';
      newExtras.signedGoodFaith = cust.signedGoodFaith ? 'Yes' : 'No';
      newExtras.noFixedAddress = cust.noFixedAddress || false;
      newExtras.memberId = cust.memberId || '';
      newExtras.workPlace = cust.workPlace || '';
      newExtras.carBrand = cust.carBrand || '';
    }

    return {
      ...DEFAULT_CUSTOMER,
      id: cust?.id || '',
      name: displayName,
      avatar: displayName ? displayName.charAt(0) : DEFAULT_CUSTOMER.avatar,
      identity: [
        { label: 'ID', value: cust?.idNumber || DEFAULT_CUSTOMER.identity[0].value },
        { label: 'Date of Birth', value: cust?.dateOfBirth || '' },
        { label: 'Gender', value: cust?.gender || '' },
        { label: 'No. of Policies', value: cust?.policies?.length?.toString() || '' },
        { label: 'Insurance Agent', value: insuranceAgent },
        { label: 'Agent Name', value: cust?.agentName || DEFAULT_CUSTOMER.identity[5].value },
        { label: 'Purchase Type', value: cust?.purchaseType || DEFAULT_CUSTOMER.identity[6].value },
      ],
      contacts: newContacts,
      extras: newExtras,
    };
  };

  const [localData, setLocalData] = useState(() => getInitialData(customer, lead));

  useEffect(() => {
    setLocalData(getInitialData(customer, lead));
    setIsEditing(false);
  }, [customer, lead]);

  const handleIdentityChange = (index: number, value: string) => {
    setLocalData((prev) => {
      const newIdentity = [...prev.identity];
      newIdentity[index] = { ...newIdentity[index], value };
      return { ...prev, identity: newIdentity };
    });
  };

  const handleExtraChange = (key: keyof typeof DEFAULT_CUSTOMER.extras, value: string | boolean) => {
    setLocalData((prev) => ({ ...prev, extras: { ...prev.extras, [key]: value } }));
  };

  const handleContactChange = (index: number, value: string) => {
    setLocalData((prev) => {
      const newContacts = [...prev.contacts];
      newContacts[index] = { ...newContacts[index], value };
      return { ...prev, contacts: newContacts };
    });
  };

  const handleSave = async () => {
    if (!localData.id) {
       setIsEditing(false);
       return;
    }
    try {
      const updatePayload = {
        customerName: localData.name,
        idNumber: localData.identity[0].value,
        dateOfBirth: localData.identity[1].value,
        gender: localData.identity[2].value,
        insuranceAgent: localData.identity[4].value,
        agentName: localData.identity[5].value,
        purchaseType: localData.identity[6].value,
        uniqueId: localData.extras.uniqueId,
        pathNumber: localData.extras.pathNumber,
        healthFund: localData.extras.healthFund,
        employer: localData.extras.employer,
        signedGoodFaith: localData.extras.signedGoodFaith === 'Yes' || (localData.extras.signedGoodFaith as any) === true,
        noFixedAddress: localData.extras.noFixedAddress,
        memberId: localData.extras.memberId,
        workPlace: localData.extras.workPlace,
        carBrand: localData.extras.carBrand,
        contacts: localData.contacts.map((c: any) => ({ type: c.type, value: c.value, label: c.label, icon: c.icon }))
      };
      await axios.put(`${API_BASE}/api/customers/${localData.id}`, updatePayload);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save customer', error);
      setIsEditing(false);
    }
  };

  const inputClass = "bg-surface border border-border rounded-md text-text text-sm px-3 py-1.5 w-full max-w-[200px] outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-100";

  return (
    <div className="flex flex-col animate-fade-in-up">

      {/* Action Bar */}
      <div className="flex items-center gap-3 px-8 py-4 border-b border-border bg-surface flex-wrap max-md:px-4">
        <button
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all ${
            isEditing
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'text-text-muted bg-surface border border-border hover:bg-neutral-50 hover:text-text'
          }`}
          onClick={() => {
            if (isEditing) {
               handleSave();
            } else {
               setIsEditing(true);
            }
          }}
        >
          {isEditing ? <><Save size={16} /> Save Changes</> : <><Pencil size={16} /> Edit Customer</>}
        </button>
        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-muted bg-surface border border-border rounded-lg cursor-pointer transition-all hover:bg-neutral-50 hover:text-text">
          <Printer size={16} /> Print
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-[360px_1fr] border-b border-border max-lg:grid-cols-1">

        {/* Left: Identity */}
        <div className="px-8 py-6 border-r border-border max-lg:border-r-0 max-lg:border-b max-md:px-4">
          <div className="flex flex-col items-center gap-3 mb-6">
            <div
              className="w-20 h-20 rounded-full bg-primary-50 border-2 border-primary-100 flex items-center justify-center text-3xl text-primary-700 shrink-0"
              style={customer ? { fontSize: '28px', fontWeight: 'bold' } : {}}
            >
              {localData.name ? localData.avatar : <User size={32} className="text-primary-400" />}
            </div>
            <div className="text-lg font-bold text-text text-center">
              {isEditing ? (
                <input
                  type="text"
                  className="bg-surface border border-border rounded-md text-text text-center text-lg font-bold max-w-[240px] px-3 py-1.5 w-full outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  value={localData.name}
                  onChange={(e) => setLocalData({ ...localData, name: e.target.value })}
                />
              ) : localData.name}
            </div>
          </div>

          <div className="flex flex-col">
            {localData.identity.map((field, i) => (
              <div key={field.label} className="flex items-baseline justify-between py-2.5 border-b border-border gap-3 last:border-b-0">
                <span className="text-xs text-text-muted whitespace-nowrap shrink-0">{field.label}</span>
                {isEditing ? (
                  <input type="text" className={inputClass + " text-right"} value={field.value} onChange={(e) => handleIdentityChange(i, e.target.value)} />
                ) : (
                  <span className={`text-sm text-right break-words ${field.value ? 'text-text font-medium' : 'text-neutral-400'}`}>
                    {field.value || '—'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Extra Details */}
        <div className="px-8 py-6 max-md:px-4">
          <div className="text-sm font-bold text-text mb-5 pb-3 border-b border-border flex items-center justify-between">
            <span>Additional Details</span>
            <span className="text-xs font-medium text-text-muted cursor-pointer hover:text-text transition-colors" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'Done' : <span className="inline-flex items-center gap-1"><Pencil size={12} /> Edit</span>}
            </span>
          </div>
          <div className="grid grid-cols-2 max-md:grid-cols-1">
            {(Object.entries({
              'Unique ID': 'uniqueId', 'Member ID': 'memberId', 'Path Number': 'pathNumber',
              'Work Place': 'workPlace', 'Health Fund': 'healthFund', 'Car Brand': 'carBrand',
              'Signed Good Faith': 'signedGoodFaith',
            }) as [string, keyof typeof DEFAULT_CUSTOMER.extras][]).map(([label, key], idx) => (
              <div key={key} className={`flex flex-col gap-1 py-3 border-b border-border ${idx % 2 === 0 ? 'pr-6 border-r border-r-border' : 'pl-6'} max-md:pr-0 max-md:pl-0 max-md:border-r-0`}>
                <span className="text-xs text-text-muted">{label}</span>
                {isEditing ? (
                  <input type="text" className={inputClass} value={String(localData.extras[key])} onChange={(e) => handleExtraChange(key, e.target.value)} />
                ) : (
                  <span className={`text-sm ${localData.extras[key] ? 'text-text font-medium' : 'text-neutral-400 italic'}`}>
                    {localData.extras[key] || '—'}
                  </span>
                )}
              </div>
            ))}
            {/* Checkbox field */}
            <div className="flex flex-col gap-1 py-3 border-b border-border pl-6 max-md:pl-0">
              <span className="text-xs text-text-muted">No Fixed Address</span>
              {isEditing ? (
                <input type="checkbox" className="mt-1 w-4 h-4 accent-primary-600" checked={Boolean(localData.extras.noFixedAddress)} onChange={(e) => handleExtraChange('noFixedAddress', e.target.checked)} />
              ) : (
                <span className="text-sm text-text font-medium inline-flex items-center gap-1.5 bg-neutral-100 px-2.5 py-0.5 rounded-full w-fit text-xs mt-1">
                  {localData.extras.noFixedAddress ? 'Yes' : 'No'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="px-8 py-6 border-b border-border max-md:px-4">
        <div className="text-sm font-bold text-text mb-5 pb-3 border-b border-border">Contact Information</div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 max-md:grid-cols-1">
          {localData.contacts.map((c: any, i: number) => (
            <div key={i} className="flex items-center gap-3.5 py-2.5 border-b border-border last:border-b-0">
              <span className="text-text-muted w-6 flex justify-center shrink-0">{c.type === 'phone' ? <Phone size={16} /> : <Smartphone size={16} />}</span>
              {isEditing ? (
                <input type="text" className={inputClass} value={c.value} onChange={(e) => handleContactChange(i, e.target.value)} />
              ) : (
                <span className="text-sm text-text font-medium tabular-nums">{c.value}</span>
              )}
              <span className="text-xs text-text-muted ml-auto">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
