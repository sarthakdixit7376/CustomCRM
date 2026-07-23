import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../../config';

type QuoteField = 'mandatoryPrice' | 'thirdPartyPrice' | 'complimentaryPrice';

interface QuoteRow {
  id: string;
  leadName: string;
  phoneNumber: string;
  mandatoryPrice?: number;
  thirdPartyPrice?: number;
  complimentaryPrice?: number;
}

const PRICE_COLUMNS: [string, QuoteField][] = [
  ['Mandatory', 'mandatoryPrice'],
  ['3rd Party', 'thirdPartyPrice'],
  ['Complimentary', 'complimentaryPrice'],
];

export default function LeadQuotes() {
  const [leads, setLeads] = useState<QuoteRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'live' | 'error'>('loading');

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

  const totalCols = 2 + PRICE_COLUMNS.length + 1;

  return (
    <div className="flex-1 overflow-auto px-8 pb-8 max-md:px-4 max-md:pb-4 mt-8">
      <div className="border border-neutral-800 rounded-lg overflow-x-auto hide-scrollbar bg-neutral-950 mt-0 animate-fade-in-up">
        <table className="w-full border-collapse table-auto">
          <thead className="sticky top-0 z-[2]">
            <tr>
              <th className="px-4 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-left bg-neutral-900 border-b border-neutral-800 whitespace-nowrap">Phone Number</th>
              <th className="px-4 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-left bg-neutral-900 border-b border-neutral-800 whitespace-nowrap">Lead Name</th>
              {PRICE_COLUMNS.map(([label]) => (
                <th key={label} className="px-4 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-left bg-neutral-900 border-b border-neutral-800 whitespace-nowrap">{label}</th>
              ))}
              <th className="px-4 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-right bg-neutral-900 border-b border-neutral-800 whitespace-nowrap">Send</th>
            </tr>
          </thead>
          <tbody>
            {status === 'loading' && leads.length === 0 ? (
              <tr className="animate-pulse">
                <td colSpan={totalCols} className="p-0 border-b border-neutral-800/50">
                  <div className="flex w-full">
                    {Array.from({ length: totalCols }).map((_, i) => (
                      <div key={i} className="flex-1 px-4 py-3">
                        <div className="h-4 bg-neutral-800 rounded w-full"></div>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ) : status === 'error' && leads.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="text-center py-10 text-red-500 text-sm">
                  Could not reach the leads API — retrying...
                </td>
              </tr>
            ) : leads.length > 0 ? (
              leads.map((row) => (
                <tr key={row.id} className="transition-colors even:bg-[#050505] hover:bg-neutral-900">
                  <td className="px-4 py-3 text-sm text-neutral-300 border-b border-neutral-800/50 whitespace-nowrap font-medium">{row.phoneNumber}</td>
                  <td className="px-4 py-3 text-sm border-b border-neutral-800/50 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[11px] font-bold text-neutral-400 shrink-0">
                        {row.leadName ? row.leadName.charAt(0).toUpperCase() : '?'}
                      </div>
                      <span className="text-white font-medium">{row.leadName}</span>
                    </div>
                  </td>
                  {PRICE_COLUMNS.map(([label, field]) => (
                    <td key={field} className="px-4 py-3 text-sm border-b border-neutral-800/50 whitespace-nowrap">
                      <input
                        key={`${row.id}-${field}-${row[field] ?? ''}`}
                        type="number"
                        defaultValue={row[field] ?? ''}
                        onBlur={(e) => handlePriceBlur(row.id, field, e.target.value)}
                        className="w-24 px-2.5 py-1.5 text-sm text-white bg-neutral-900 border border-neutral-800 rounded-md outline-none transition-all hover:border-neutral-600 focus:border-white"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-sm border-b border-neutral-800/50 whitespace-nowrap text-right">
                    <button
                      disabled
                      title="Coming soon"
                      className="px-3 py-1.5 text-xs font-semibold rounded-md border border-neutral-800 bg-neutral-900 text-neutral-600 cursor-not-allowed"
                    >
                      Send
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={totalCols} className="text-center py-10 text-neutral-600">
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
