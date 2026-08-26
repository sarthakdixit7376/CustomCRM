import { useState, useEffect, useRef, Fragment } from 'react';
import axios from 'axios';
import { Send, Loader2, UserCheck, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import { API_BASE } from '../../config';
import ConvertToCustomerModal, { type ConvertToCustomerFormData } from './ConvertToCustomerModal';

type QuoteField = 'mandatoryPrice' | 'thirdPartyPrice' | 'complimentaryPrice';
type AddonField = 'glassAndMoreSelected' | 'complementaryVipSelected';

interface QuoteFactor {
  label: string;
  multiplier: number;
}

interface QuoteLine {
  price: number;
  base: number;
  factors: QuoteFactor[];
}

/** Rating breakdown returned by the pricing engine alongside the saved prices. */
interface QuoteResult {
  mandatoryPrice: number;
  thirdPartyPrice: number;
  complimentaryPrice: number;
  estimatedVehicleValue: number;
  profile: {
    driverAge: number;
    licenseYears: number;
    claimFreeYears: number;
    vehicleAgeYears: number;
    engineCc: number;
    horsePower: number;
    safetyLevel: number;
    vehicleType?: string;
    ownership?: string;
    district?: string;
    assumed: string[];
  };
  breakdown: {
    mandatory: QuoteLine;
    thirdParty: QuoteLine;
    complimentary: QuoteLine;
  };
  sources: string[];
}

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
  const [convertingLead, setConvertingLead] = useState<QuoteRow | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [quotingId, setQuotingId] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Record<string, QuoteResult>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  /** Leads we have already auto-priced this session, so the 8s poll can't loop on them. */
  const autoQuotedRef = useRef<Set<string>>(new Set());

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
        void autoQuoteMissing(mapped);
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

  /**
   * Prices a lead off its driver + vehicle data via the insurance engine and writes
   * the result into the row. `onlyMissing` leaves prices an agent already set alone.
   */
  const runAutoQuote = async (leadId: string, onlyMissing: boolean) => {
    const response = await axios.post<{ lead: any; quote: QuoteResult }>(
      `${API_BASE}/api/leads/${leadId}/auto-quote`,
      { onlyMissing }
    );
    const { lead, quote } = response.data;

    setQuotes((prev) => ({ ...prev, [leadId]: quote }));
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              mandatoryPrice: lead.mandatoryPrice ?? l.mandatoryPrice,
              thirdPartyPrice: lead.thirdPartyPrice ?? l.thirdPartyPrice,
              complimentaryPrice: lead.complimentaryPrice ?? l.complimentaryPrice,
            }
          : l
      )
    );
    return quote;
  };

  /** Fills in any lead that arrived without a full set of prices. */
  const autoQuoteMissing = async (rows: QuoteRow[]) => {
    const pending = rows.filter(
      (row) =>
        !autoQuotedRef.current.has(row.id) &&
        (row.mandatoryPrice == null || row.thirdPartyPrice == null || row.complimentaryPrice == null)
    );

    for (const row of pending) {
      autoQuotedRef.current.add(row.id);
      try {
        await runAutoQuote(row.id, true);
      } catch (error) {
        console.error('Failed to auto-quote lead:', error);
      }
    }
  };

  /** Manual re-price: recalculates all three columns, overwriting what is there. */
  const handleRecalculate = async (leadId: string) => {
    setQuotingId(leadId);
    try {
      await runAutoQuote(leadId, false);
      setExpandedId(leadId);
    } catch (error) {
      console.error('Failed to recalculate quote:', error);
      alert('Failed to recalculate the quote. Please try again.');
    } finally {
      setQuotingId(null);
    }
  };

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

  const handleConvertSubmit = async (data: ConvertToCustomerFormData) => {
    if (!convertingLead) return;
    setIsConverting(true);
    try {
      await axios.post(`${API_BASE}/api/leads/${convertingLead.id}/convert-to-customer`, data);
      setLeads((prev) => prev.filter((l) => l.id !== convertingLead.id));
      setConvertingLead(null);
    } catch (error) {
      console.error('Failed to convert lead to customer:', error);
      alert('Failed to transfer lead to customer. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const totalCols = 2 + PRICE_COLUMNS.length + ADDON_COLUMNS.length + 2;

  return (
    <div className="flex-1 overflow-auto px-8 pb-8 max-md:px-4 max-md:pb-4 mt-8">
      <div className="border border-border rounded-lg overflow-x-auto bg-surface shadow-card mt-0 animate-fade-in-up">
        <table className="w-full border-collapse table-auto">
          <thead className="sticky top-0 z-[2]">
            <tr>
              <th className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border whitespace-nowrap">Phone Number</th>
              <th className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border whitespace-nowrap">Lead Name</th>
              {PRICE_COLUMNS.map(([label]) => (
                <th key={label} className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border whitespace-nowrap">{label}</th>
              ))}
              <th className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border whitespace-nowrap">Auto-quote</th>
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
                <Fragment key={row.id}>
                <tr className="transition-colors hover:bg-neutral-50">
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
                  <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleRecalculate(row.id)}
                        disabled={quotingId === row.id}
                        title="Re-price this lead from its driver and vehicle details"
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-md border border-border bg-surface text-text hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-wait inline-flex items-center gap-1.5"
                      >
                        {quotingId === row.id
                          ? <Loader2 size={12} className="animate-spin" />
                          : <Sparkles size={12} className="text-primary-600" />}
                        Re-price
                      </button>
                      {quotes[row.id] && (
                        <button
                          onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                          title="Show how this price was calculated"
                          className="p-1.5 rounded-md text-text-muted hover:bg-neutral-100 transition-colors"
                        >
                          {expandedId === row.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      )}
                    </div>
                  </td>
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
                    <div className="inline-flex items-center gap-2">
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
                      <button
                        onClick={() => setConvertingLead(row)}
                        disabled={!row.pricingPdfUrl}
                        title={row.pricingPdfUrl ? 'Transfer this lead to a customer' : 'Generate the pricing PDF first'}
                        className="px-3 py-1.5 text-xs font-semibold rounded-md border border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                      >
                        <UserCheck size={12} /> Transfer
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === row.id && quotes[row.id] && (
                  <tr>
                    <td colSpan={totalCols} className="px-4 py-4 border-b border-border bg-neutral-50/60">
                      <QuoteBreakdown quote={quotes[row.id]} />
                    </td>
                  </tr>
                )}
                </Fragment>
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

      <ConvertToCustomerModal
        isOpen={!!convertingLead}
        leadName={convertingLead?.leadName}
        onClose={() => setConvertingLead(null)}
        onSubmit={handleConvertSubmit}
        isSubmitting={isConverting}
      />
    </div>
  );
}

const LINE_LABELS: [keyof QuoteResult['breakdown'], string][] = [
  ['mandatory', 'Mandatory (hova)'],
  ['thirdParty', '3rd party (tzad gimel)'],
  ['complimentary', 'Complimentary (makif)'],
];

/** Shows why the engine priced a lead the way it did, factor by factor. */
function QuoteBreakdown({ quote }: { quote: QuoteResult }) {
  const { profile } = quote;

  const profileBits = [
    `Driver ${profile.driverAge}`,
    `${profile.licenseYears} yrs license`,
    `${profile.claimFreeYears} claim-free yrs`,
    `Vehicle ${profile.vehicleAgeYears} yrs old`,
    `${profile.engineCc}cc / ${profile.horsePower}hp`,
    `Safety level ${profile.safetyLevel}`,
    profile.district,
    profile.ownership,
  ].filter(Boolean);

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted mb-3">
        {profileBits.map((bit) => (
          <span key={bit as string} className="px-2 py-0.5 rounded bg-surface border border-border">{bit}</span>
        ))}
        <span className="px-2 py-0.5 rounded bg-surface border border-border">
          Est. vehicle value ₪{quote.estimatedVehicleValue.toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
        {LINE_LABELS.map(([key, label]) => {
          const line = quote.breakdown[key];
          return (
            <div key={key} className="bg-surface border border-border rounded-md p-3">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</span>
                <span className="text-sm font-bold text-text">₪{line.price.toLocaleString()}</span>
              </div>
              <div className="text-[11px] text-text-muted space-y-0.5">
                <div className="flex justify-between">
                  <span>Base rate</span>
                  <span>₪{line.base.toLocaleString()}</span>
                </div>
                {line.factors.map((factor) => (
                  <div key={factor.label} className="flex justify-between gap-2">
                    <span className="truncate">{factor.label}</span>
                    <span className={factor.multiplier > 1 ? 'text-danger-600' : factor.multiplier < 1 ? 'text-primary-600' : ''}>
                      ×{factor.multiplier}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {profile.assumed.length > 0 && (
        <p className="mt-3 text-[11px] text-text-muted">
          <span className="font-semibold">Assumed defaults for:</span> {profile.assumed.join(', ')} — fill these in on the lead for a sharper price.
        </p>
      )}
      <p className="mt-1 text-[11px] text-text-muted">
        Agency estimate. Verify before binding: {quote.sources.join(' · ')}
      </p>
    </div>
  );
}
