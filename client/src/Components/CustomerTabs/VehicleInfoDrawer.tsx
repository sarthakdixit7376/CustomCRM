import { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

const VEHICLE_INFO_RESOURCE_ID = '053cea08-09bc-40ec-8f7a-156f0677aff3';

const FIELD_LABELS_HE: Record<string, string> = {
  _id: 'מזהה רשומה',
  mispar_rechev: 'מספר רכב',
  tozeret_cd: 'קוד תוצרת',
  sug_degem: 'סוג דגם',
  tozeret_nm: 'שם תוצרת',
  degem_cd: 'קוד דגם',
  shnat_yitzur: 'שנת ייצור',
  degem_nm: 'שם דגם',
  ramat_gimur: 'רמת גימור',
  ramat_eivzur_betihuti: 'רמת אבזור בטיחותי',
  kvutzat_zihum: 'קבוצת זיהום',
  tzeva_cd: 'קוד צבע',
  tzeva_rechev: 'צבע רכב',
  zmig_kidmi: 'צמיג קדמי',
  zmig_ahori: 'צמיג אחורי',
  sug_delek_nm: 'סוג דלק',
  horaat_rishum: 'הוראת רישום',
  moed_aliya_lakvish: 'מועד עליה לכביש',
  baalut: 'בעלות',
  misgeret: 'מספר שילדה',
  tozeret_eretz_nm: 'ארץ תוצרת',
  mishkal_kolel: 'משקל כולל',
  nefah_manoa: 'נפח מנוע',
  kinuy_mishari: 'כינוי מסחרי',
  mivchan_acharon_dt: 'תאריך מבחן אחרון',
  tokef_dt: 'תוקף רישוי',
  taarich_pkika_dt: 'תאריך פקיעת תוקף',
  taarich_pkiah: 'תאריך פקיעת תוקף',
  kvuzat_agra: 'קבוצת אגרה',
  mahoz_moshav: 'מחוז מושב',
  sug_rechev_nm: 'סוג רכב',
  degem_manoa: 'קוד מנוע',
  koach_sus: 'כוח סוס',
  mispar_dlatot: 'מספר דלתות',
  mispar_moshavim: 'מספר מושבים',
};

const humanizeKey = (key: string) =>
  key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const translateField = (key: string) => FIELD_LABELS_HE[key] ?? humanizeKey(key);

export interface VehicleInfoDrawerProps {
  vehicleNumber: string;
  onClose: () => void;
}

export default function VehicleInfoDrawer({ vehicleNumber, onClose }: VehicleInfoDrawerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchVehicleInfo = async () => {
      setLoading(true);
      setError(null);
      setData(null);

      try {
        const filters = encodeURIComponent(JSON.stringify({ mispar_rechev: vehicleNumber }));
        const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${VEHICLE_INFO_RESOURCE_ID}&filters=${filters}&limit=1`;
        const response = await axios.get(url);
        const record = response.data?.result?.records?.[0];
        if (!isMounted) return;

        if (record) {
          setData(record);
        } else {
          setError('No information found for this vehicle number.');
        }
      } catch (err) {
        console.error('Failed to fetch vehicle info:', err);
        if (isMounted) setError('Failed to fetch vehicle information.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchVehicleInfo();

    return () => {
      isMounted = false;
    };
  }, [vehicleNumber]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-surface border-l border-border shadow-dropdown overflow-y-auto animate-slide-in-right">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-surface border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-text uppercase tracking-wider">Vehicle Info</h2>
            <p className="text-xs text-text-muted mt-0.5">Vehicle Number: {vehicleNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors p-1.5 rounded hover:bg-neutral-100"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-4 bg-neutral-200 rounded w-full"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10 text-danger-600 text-sm">{error}</div>
          ) : data ? (
            <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
              {Object.entries(data)
                .filter(([key]) => key !== '_id')
                .map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1 px-4 py-3 even:bg-neutral-50">
                    <span className="text-[11px] font-semibold text-text-muted tracking-wider">{translateField(key)}</span>
                    <span className="text-sm text-text break-words">{value === null || value === undefined || value === '' ? '—' : String(value)}</span>
                  </div>
                ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
