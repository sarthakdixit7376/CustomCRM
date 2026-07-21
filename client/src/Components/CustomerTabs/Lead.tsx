import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../../config';
import VehicleInfoDrawer from './VehicleInfoDrawer';

export interface LeadRow {
  id: string;
  createdAt?: string;
  pdfUrl?: string;
  leadName: string;
  phoneNumber: string;

  // Person-specific fields
  age?: string;
  dateOfBirth?: string;
  cost?: string;
  yearOfLicenseIssued?: string;

  // Vehicle info fields
  misparRechev?: string;
  tozeretCd?: string;
  sugDegem?: string;
  tozeretNm?: string;
  degemCd?: string;
  shnatYitzur?: string;
  degemNm?: string;
  ramatGimur?: string;
  ramatEivzurBetihuti?: string;
  kvutzatZihum?: string;
  tzevaCd?: string;
  tzevaRechev?: string;
  zmigKidmi?: string;
  zmigAhori?: string;
  sugDelekNm?: string;
  horaatRishum?: string;
  moedAliyaLakvish?: string;
  baalut?: string;
  misgeret?: string;
  tozeretEretzNm?: string;
  mishkalKolel?: string;
  nefahManoa?: string;
  kinuyMishari?: string;
  mivchanAcharonDt?: string;
  tokefDt?: string;
  taarichPkikaDt?: string;
  taarichPkiah?: string;
  kvuzatAgra?: string;
  mahozMoshav?: string;
  sugRechevNm?: string;
  degemManoa?: string;
  koachSus?: string;
  misparDlatot?: string;
  misparMoshavim?: string;
}

/** Column definitions: [header label, LeadRow key] */
const COLUMNS: [string, keyof LeadRow][] = [
  ['Phone Number', 'phoneNumber'],
  ['Lead Name', 'leadName'],
  ['מספר רכב', 'misparRechev'],
  ['קוד תוצרת', 'tozeretCd'],
  ['סוג דגם', 'sugDegem'],
  ['שם תוצרת', 'tozeretNm'],
  ['קוד דגם', 'degemCd'],
  ['שנת ייצור', 'shnatYitzur'],
  ['שם דגם', 'degemNm'],
  ['רמת גימור', 'ramatGimur'],
  ['רמת אבזור בטיחותי', 'ramatEivzurBetihuti'],
  ['קבוצת זיהום', 'kvutzatZihum'],
  ['קוד צבע', 'tzevaCd'],
  ['צבע רכב', 'tzevaRechev'],
  ['צמיג קדמי', 'zmigKidmi'],
  ['צמיג אחורי', 'zmigAhori'],
  ['סוג דלק', 'sugDelekNm'],
  ['הוראת רישום', 'horaatRishum'],
  ['מועד עליה לכביש', 'moedAliyaLakvish'],
  ['בעלות', 'baalut'],
  ['מספר שילדה', 'misgeret'],
  ['ארץ תוצרת', 'tozeretEretzNm'],
  ['משקל כולל', 'mishkalKolel'],
  ['נפח מנוע', 'nefahManoa'],
  ['כינוי מסחרי', 'kinuyMishari'],
  ['תאריך מבחן אחרון', 'mivchanAcharonDt'],
  ['תוקף רישוי', 'tokefDt'],
  ['תאריך פקיעת תוקף', 'taarichPkikaDt'],
  ['תאריך פקיעת תוקף 2', 'taarichPkiah'],
  ['קבוצת אגרה', 'kvuzatAgra'],
  ['מחוז מושב', 'mahozMoshav'],
  ['סוג רכב', 'sugRechevNm'],
  ['קוד מנוע', 'degemManoa'],
  ['כוח סוס', 'koachSus'],
  ['מספר דלתות', 'misparDlatot'],
  ['מספר מושבים', 'misparMoshavim'],
  ['Age', 'age'],
  ['Date of Birth', 'dateOfBirth'],
  ['Cost', 'cost'],
  ['Year of License Issued', 'yearOfLicenseIssued'],
];

const TOTAL_COLS = COLUMNS.length + 1; // +1 for Actions column

export interface LeadProps {
  onSelectLead?: (lead: LeadRow) => void;
}

export default function Lead({ onSelectLead }: LeadProps) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'live' | 'error'>('loading');

  const [infoVehicleNumber, setInfoVehicleNumber] = useState<string | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this lead?')) return;

    try {
      await axios.delete(`${API_BASE}/api/leads/${id}`);
      setLeads(prevLeads => prevLeads.filter(lead => lead.id !== id));
    } catch (error) {
      console.error('Failed to delete lead:', error);
      alert('Failed to delete lead');
    }
  };

  const handleInfo = (vehicleNumber: string | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (vehicleNumber) setInfoVehicleNumber(vehicleNumber);
  };

  const closeInfo = () => {
    setInfoVehicleNumber(null);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchLeads = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/leads`);
        if (isMounted) {
          // Handle both { leads: [...] } and direct [...] array responses just in case
          const dataList = response.data.leads || response.data;

          const mappedLeads = dataList.map((lead: any) => ({
            id: lead.id,
            createdAt: lead.createdAt,
            pdfUrl: lead.pdfUrl,
            leadName: lead.leadName || lead.lead_name,
            phoneNumber: lead.phoneNumber || lead.phone_number,

            // Person-specific
            age: lead.age,
            dateOfBirth: lead.dateOfBirth || lead.date_of_birth,
            cost: lead.cost,
            yearOfLicenseIssued: lead.yearOfLicenseIssued || lead.year_of_license_issued,

            // Vehicle info
            misparRechev: lead.misparRechev || lead.mispar_rechev,
            tozeretCd: lead.tozeretCd || lead.tozeret_cd,
            sugDegem: lead.sugDegem || lead.sug_degem,
            tozeretNm: lead.tozeretNm || lead.tozeret_nm,
            degemCd: lead.degemCd || lead.degem_cd,
            shnatYitzur: lead.shnatYitzur || lead.shnat_yitzur,
            degemNm: lead.degemNm || lead.degem_nm,
            ramatGimur: lead.ramatGimur || lead.ramat_gimur,
            ramatEivzurBetihuti: lead.ramatEivzurBetihuti || lead.ramat_eivzur_betihuti,
            kvutzatZihum: lead.kvutzatZihum || lead.kvutzat_zihum,
            tzevaCd: lead.tzevaCd || lead.tzeva_cd,
            tzevaRechev: lead.tzevaRechev || lead.tzeva_rechev,
            zmigKidmi: lead.zmigKidmi || lead.zmig_kidmi,
            zmigAhori: lead.zmigAhori || lead.zmig_ahori,
            sugDelekNm: lead.sugDelekNm || lead.sug_delek_nm,
            horaatRishum: lead.horaatRishum || lead.horaat_rishum,
            moedAliyaLakvish: lead.moedAliyaLakvish || lead.moed_aliya_lakvish,
            baalut: lead.baalut,
            misgeret: lead.misgeret,
            tozeretEretzNm: lead.tozeretEretzNm || lead.tozeret_eretz_nm,
            mishkalKolel: lead.mishkalKolel || lead.mishkal_kolel,
            nefahManoa: lead.nefahManoa || lead.nefah_manoa,
            kinuyMishari: lead.kinuyMishari || lead.kinuy_mishari,
            mivchanAcharonDt: lead.mivchanAcharonDt || lead.mivchan_acharon_dt,
            tokefDt: lead.tokefDt || lead.tokef_dt,
            taarichPkikaDt: lead.taarichPkikaDt || lead.taarich_pkika_dt,
            taarichPkiah: lead.taarichPkiah || lead.taarich_pkiah,
            kvuzatAgra: lead.kvuzatAgra || lead.kvuzat_agra,
            mahozMoshav: lead.mahozMoshav || lead.mahoz_moshav,
            sugRechevNm: lead.sugRechevNm || lead.sug_rechev_nm,
            degemManoa: lead.degemManoa || lead.degem_manoa,
            koachSus: lead.koachSus || lead.koach_sus,
            misparDlatot: lead.misparDlatot || lead.mispar_dlatot,
            misparMoshavim: lead.misparMoshavim || lead.mispar_moshavim,
          }));

          setLeads(mappedLeads);
          setStatus('live');
        }
      } catch (error) {
        if (isMounted) {
          setStatus('error');
        }
      }
    };

    fetchLeads();
    const interval = setInterval(fetchLeads, 8000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex-1 overflow-auto px-8 pb-8 max-md:px-4 max-md:pb-4 mt-8">
      <div className="border border-neutral-800 rounded-lg overflow-x-auto hide-scrollbar bg-neutral-950 mt-0 animate-fade-in-up">
        <table className="w-full border-collapse table-auto min-w-[3200px]">
          <thead className="sticky top-0 z-[2]">
            <tr>
              {COLUMNS.map(([h]) => (
                <th key={h} className="group px-4 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-left bg-neutral-900 border-b border-neutral-800 whitespace-nowrap select-none cursor-pointer hover:text-neutral-300 transition-colors">
                  <span className="inline-flex items-center gap-1.5">{h} <span className="text-[10px] opacity-0 group-hover:opacity-50 transition-opacity">▾</span></span>
                </th>
              ))}
              <th className="px-4 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-right bg-neutral-900 border-b border-neutral-800 whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {status === 'loading' && leads.length === 0 ? (
              <tr className="animate-pulse">
                <td colSpan={TOTAL_COLS} className="p-0 border-b border-neutral-800/50">
                  <div className="flex w-full">
                    {Array.from({ length: TOTAL_COLS }).map((_, i) => (
                      <div key={i} className="flex-1 px-4 py-3">
                        <div className="h-4 bg-neutral-800 rounded w-full"></div>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ) : status === 'error' && leads.length === 0 ? (
              <tr>
                <td colSpan={TOTAL_COLS} className="text-center py-10 text-red-500 text-sm">
                  Could not reach the leads API — retrying...
                </td>
              </tr>
            ) : leads.length > 0 ? (
              leads.map((row) => (
                <tr key={row.id} className="transition-colors even:bg-[#050505] hover:bg-neutral-900">
                  {/* Phone Number */}
                  <td className="px-4 py-3 text-sm text-neutral-300 border-b border-neutral-800/50 whitespace-nowrap font-medium">{row.phoneNumber}</td>
                  {/* Lead Name with avatar */}
                  <td className="px-4 py-3 text-sm border-b border-neutral-800/50 whitespace-nowrap">
                    <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onSelectLead?.(row)}>
                      <div className="w-7 h-7 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[11px] font-bold text-neutral-400 shrink-0">
                        {row.leadName ? row.leadName.charAt(0).toUpperCase() : '?'}
                      </div>
                      <span className="text-white font-medium">{row.leadName}</span>
                    </div>
                  </td>
                  {/* All remaining columns (skip first two which are phoneNumber and leadName) */}
                  {COLUMNS.slice(2).map(([, key]) => (
                    <td key={key} className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">{row[key] ?? '—'}</td>
                  ))}
                  {/* Actions */}
                  <td className="px-4 py-3 text-sm border-b border-neutral-800/50 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => handleInfo(row.misparRechev, e)}
                        className="text-blue-500 hover:text-blue-400 transition-colors p-1.5 rounded hover:bg-blue-500/10"
                        title="Vehicle Info"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDelete(row.id, e)}
                        className="text-red-500 hover:text-red-400 transition-colors p-1.5 rounded hover:bg-red-500/10"
                        title="Delete Lead"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={TOTAL_COLS} className="text-center py-10 text-neutral-600">
                  No leads yet — new submissions will appear here automatically
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {infoVehicleNumber && (
        <VehicleInfoDrawer vehicleNumber={infoVehicleNumber} onClose={closeInfo} />
      )}
    </div>
  );
}
