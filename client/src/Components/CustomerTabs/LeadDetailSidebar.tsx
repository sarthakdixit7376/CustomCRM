import type { LeadRow } from './Lead';

/** Every field on LeadRow except the ones already shown as table columns (phoneNumber, leadName, leadStatus, id). */
const DETAIL_FIELDS: [string, keyof LeadRow][] = [
  ['Created At', 'createdAt'],
  ['PDF', 'pdfUrl'],
  ['Age', 'age'],
  ['Date of Birth', 'dateOfBirth'],
  ['Cost', 'cost'],
  ['Year of License Issued', 'yearOfLicenseIssued'],
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
];

export interface LeadDetailSidebarProps {
  lead: LeadRow;
  onClose: () => void;
}

export default function LeadDetailSidebar({ lead, onClose }: LeadDetailSidebarProps) {
  const renderValue = (key: keyof LeadRow, value: unknown) => {
    if (value === null || value === undefined || value === '') return '—';
    if (key === 'createdAt') return new Date(String(value)).toLocaleString();
    if (key === 'pdfUrl') {
      return (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          View PDF
        </a>
      );
    }
    return String(value);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-neutral-950 border-l border-neutral-800 z-50 overflow-y-auto shadow-2xl animate-slide-in-right">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 sticky top-0 bg-neutral-950 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center text-sm font-bold text-neutral-400 shrink-0">
              {lead.leadName ? lead.leadName.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <div className="text-white font-semibold leading-tight">{lead.leadName || 'Unknown'}</div>
              <div className="text-xs text-neutral-500">{lead.phoneNumber}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300 transition-colors p-1.5 rounded hover:bg-neutral-800"
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            {DETAIL_FIELDS.map(([label, key]) => (
              <div key={key}>
                <dt className="text-[11px] text-neutral-500 mb-0.5">{label}</dt>
                <dd className="text-sm text-neutral-200 break-words">{renderValue(key, lead[key])}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </>
  );
}
