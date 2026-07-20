import { useState, useEffect } from 'react';
import axios from 'axios';

const VEHICLE_INFO_RESOURCE_ID = '053cea08-09bc-40ec-8f7a-156f0677aff3';

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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-neutral-950 border-l border-neutral-800 shadow-2xl overflow-y-auto animate-slide-in-right">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-neutral-900 border-b border-neutral-800">
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Vehicle Info</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Vehicle Number: {vehicleNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300 transition-colors p-1.5 rounded hover:bg-neutral-800"
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-4 bg-neutral-800 rounded w-full"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500 text-sm">{error}</div>
          ) : data ? (
            <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-lg overflow-hidden">
              {Object.entries(data).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1 px-4 py-3 even:bg-[#050505]">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">{key}</span>
                  <span className="text-sm text-neutral-200 break-words">{value === null || value === undefined || value === '' ? '—' : String(value)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
