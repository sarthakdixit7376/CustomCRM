import { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, Loader2 } from 'lucide-react';
import { API_BASE } from '../../config';

type QuoteField = 'mandatoryPrice' | 'thirdPartyPrice' | 'complimentaryPrice';
type AddonField = 'glassAndMoreSelected' | 'complementaryVipSelected';

interface QuoteRow {
  id: string;
  leadName: string;
  phoneNumber: string;
  mandatoryPrice?: number;
  thirdPartyPrice?: number;
  complimentaryPrice?: number;
  glassAndMoreSelected?: boolean;
  complementaryVipSelected?: boolean;
  pricingPdfUrl?: string;
}

const PRICE_COLUMNS: [string, QuoteField][] = [
  ['Mandatory', 'mandatoryPrice'],
  ['3rd Party', 'thirdPartyPrice'],
  ['Complimentary', 'complimentaryPrice'],
];

const ADDON_COLUMNS: [string, AddonField, number][] = [
  ['Glass and More', 'glassAndMoreSelected', 320],
  ['Complementary + VIP', 'complementaryVipSelected', 550],
];

export default function LeadQuotes() {
  const [leads, setLeads] = useState<QuoteRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'live' | 'error'>('loading');
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLeads = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/leads`);
        if (!isMounted) return;
        const dataList = response.data.leads || response.data;
        const mapped: QuoteRow[] = dataList.map((lead: any) => ({
          id: lead.id,
          leadName: lead.leadName || lead.lead_name,
          phoneNumber: lead.phoneNumber || lead.phone_number,
          mandatoryPrice: lead.mandatoryPrice,
          thirdPartyPrice: lead.thirdPartyPrice,
          complimentaryPrice: lead.complimentaryPrice,
          glassAndMoreSelected: lead.glassAndMoreSelected,
          complementaryVipSelected: lead.complementaryVipSelected,
          pricingPdfUrl: lead.pricingPdfUrl,
        }));
        setLeads(mapped);
        setStatus('live');
      } catch (error) {
        if (isMounted) setStatus('error');
      }
    };

    fetchLeads();
    const interval = setInterval(fetchLeads, 8000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handlePriceBlur = async (leadId: string, field: QuoteField, rawValue: string) => {
    const num = Number(rawValue);
    if (rawValue.trim() === '' || Number.isNaN(num)) return;

    const previous = leads.find((l) => l.id === leadId)?.[field];
    if (previous === num) return;

    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, [field]: num } : l)));

    try {
      await axios.patch(`${API_BASE}/api/leads/${leadId}/quote`, { [field]: num });
    } catch (error) {
      console.error('Failed to update quote price:', error);
      alert('Failed to save price change');
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, [field]: previous } : l)));
    }
  };

  const handleAddonToggle = async (leadId: string, field: AddonField, checked: boolean) => {
    const previous = leads.find((l) => l.id === leadId)?.[field];
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, [field]: checked } : l)));

    try {
      await axios.patch(`${API_BASE}/api/leads/${leadId}/quote`, { [field]: checked });
    } catch (error) {
      console.error('Failed to update addon selection:', error);
      alert('Failed to save selection change');
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, [field]: previous } : l)));
    }
  };

  const handleSend = async (leadId: string) => {
    setSendingId(leadId);
    try {
      const response = await axios.post(`${API_BASE}/api/leads/${leadId}/pricing-pdf`);
      const { pricingPdfUrl, whatsappLink } = response.data;
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, pricingPdfUrl } : l)));
      window.open(whatsappLink, '_blank');
    } catch (error) {
      console.error('Failed to generate/send pricing PDF:', error);
      alert('Failed to generate the pricing PDF. Please try again.');
    } finally {
      setSendingId(null);
    }
  };

  const totalCols = 2 + PRICE_COLUMNS.length + ADDON_COLUMNS.length + 1;

  return (
    <div className="flex-1 overflow-auto px-8 pb-8 max-md:px-4 max-md:pb-4 mt-8">
      <div className="border border-border rounded-lg overflow-x-auto hide-scrollbar bg-surface shadow-card mt-0 animate-fade-in-up">
        <table className="w-full border-collapse table-auto">
          <thead className="sticky top-0 z-[2]">
            <tr>
              <th className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border whitespace-nowrap">Phone Number</th>
              <th className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border whitespace-nowrap">Lead Name</th>
              {PRICE_COLUMNS.map(([label]) => (
                <th key={label} className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border whitespace-nowrap">{label}</th>
              ))}
              {ADDON_COLUMNS.map(([label, , price]) => (
                <th key={label} className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border whitespace-nowrap">{label} (₪{price})</th>
              ))}
              <th className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-right bg-neutral-50 border-b border-border whitespace-nowrap">Send</th>
            </tr>
          </thead>
          <tbody>
            {status === 'loading' && leads.length === 0 ? (
              <tr className="animate-pulse">
                <td colSpan={totalCols} className="p-0 border-b border-border">
                  <div className="flex w-full">
                    {Array.from({ length: totalCols }).map((_, i) => (
                      <div key={i} className="flex-1 px-4 py-3">
                        <div className="h-4 bg-neutral-200 rounded w-full"></div>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ) : status === 'error' && leads.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="text-center py-10 text-danger-600 text-sm">
                  Could not reach the leads API — retrying...
                </td>
              </tr>
            ) : leads.length > 0 ? (
              leads.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-neutral-50">
                  <td className="px-4 py-3 text-sm text-text border-b border-border whitespace-nowrap font-medium">{row.phoneNumber}</td>
                  <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-primary-50 border border-primary-100 flex items-center justify-center text-[11px] font-bold text-primary-700 shrink-0">
                        {row.leadName ? row.leadName.charAt(0).toUpperCase() : '?'}
                      </div>
                      <span className="text-text font-medium">{row.leadName}</span>
                    </div>
                  </td>
                  {PRICE_COLUMNS.map(([, field]) => (
                    <td key={field} className="px-4 py-3 text-sm border-b border-border whitespace-nowrap">
                      <input
                        key={`${row.id}-${field}-${row[field] ?? ''}`}
                        type="number"
                        defaultValue={row[field] ?? ''}
                        onBlur={(e) => handlePriceBlur(row.id, field, e.target.value)}
                        className="w-24 px-2.5 py-1.5 text-sm text-text bg-surface border border-border rounded-md outline-none transition-all hover:border-neutral-300 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                      />
                    </td>
                  ))}
                  {ADDON_COLUMNS.map(([, field]) => (
                    <td key={field} className="px-4 py-3 text-sm border-b border-border whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={row[field] ?? false}
                        onChange={(e) => handleAddonToggle(row.id, field, e.target.checked)}
                        className="w-4 h-4 rounded border-border text-primary-600 focus:ring-2 focus:ring-primary-100"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap text-right">
                    <button
                      onClick={() => handleSend(row.id)}
                      disabled={sendingId === row.id}
                      title="Generate pricing PDF and send via WhatsApp"
                      className="px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-surface text-text hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-wait inline-flex items-center gap-1.5"
                    >
                      {sendingId === row.id
                        ? <><Loader2 size={12} className="animate-spin" /> Sending…</>
                        : <><Send size={12} /> Send</>}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={totalCols} className="text-center py-10 text-text-muted">
                  No leads yet — quotes will appear here automatically once leads are created
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
