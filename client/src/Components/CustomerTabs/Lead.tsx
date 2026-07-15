import { useState } from 'react';

export interface LeadRow {
  id: number;
  leadName: string;
  phoneNumber: string;
  vehicleNumber: string;
  engineCc: string;
  registrationNumber: string;
  validUntil: string;
  vehicleType: string;
  vehicleModel: string;
}

const INITIAL_LEADS: LeadRow[] = [
  { id: 1, leadName: 'John Doe', phoneNumber: '050-1234567', vehicleNumber: '12-345-67', engineCc: '1600', registrationNumber: '987654321', validUntil: '31/12/2026', vehicleType: 'Car', vehicleModel: 'Toyota Corolla' },
  { id: 2, leadName: 'Jane Smith', phoneNumber: '052-7654321', vehicleNumber: '98-765-43', engineCc: '2000', registrationNumber: '123456789', validUntil: '15/05/2027', vehicleType: 'Car', vehicleModel: 'Honda Civic' },
  { id: 3, leadName: 'Mike Johnson', phoneNumber: '054-9876543', vehicleNumber: '56-789-01', engineCc: '1000', registrationNumber: '456789123', validUntil: '20/08/2026', vehicleType: 'Motorcycle', vehicleModel: 'Yamaha MT-07' },
  { id: 4, leadName: 'Sarah Williams', phoneNumber: '053-1112233', vehicleNumber: '11-222-33', engineCc: '1400', registrationNumber: '112233445', validUntil: '05/11/2025', vehicleType: 'Car', vehicleModel: 'Kia Picanto' },
];

export interface LeadProps {
  onSelectLead?: (lead: LeadRow) => void;
}

export default function Lead({ onSelectLead }: LeadProps) {
  const [leads] = useState<LeadRow[]>(INITIAL_LEADS);

  return (
    <div className="flex-1 overflow-auto px-8 pb-8 max-md:px-4 max-md:pb-4 mt-8">
      <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950 mt-0 animate-fade-in-up">
        <table className="w-full border-collapse table-auto">
          <thead className="sticky top-0 z-[2]">
            <tr>
              {['Lead Name', 'Phone Number', 'Vehicle Number', 'Engine CC', 'Registration Number', 'Valid Until', 'Vehicle Type', 'Vehicle Model'].map((h) => (
                <th key={h} className="group px-4 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-left bg-neutral-900 border-b border-neutral-800 whitespace-nowrap select-none cursor-pointer hover:text-neutral-300 transition-colors">
                  <span className="inline-flex items-center gap-1.5">{h} <span className="text-[10px] opacity-0 group-hover:opacity-50 transition-opacity">▾</span></span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.length > 0 ? (
              leads.map((row) => (
                <tr key={row.id} className="transition-colors even:bg-[#050505] hover:bg-neutral-900">
                  <td className="px-4 py-3 text-sm border-b border-neutral-800/50 whitespace-nowrap">
                    <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onSelectLead?.(row)}>
                      <div className="w-7 h-7 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[11px] font-bold text-neutral-400 shrink-0">
                        {row.leadName.charAt(0)}
                      </div>
                      <span className="text-white font-medium">{row.leadName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-300 border-b border-neutral-800/50 whitespace-nowrap font-medium">{row.phoneNumber}</td>
                  <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">{row.vehicleNumber}</td>
                  <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">{row.engineCc}</td>
                  <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">{row.registrationNumber}</td>
                  <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">{row.validUntil}</td>
                  <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">{row.vehicleType}</td>
                  <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">{row.vehicleModel}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-10 text-neutral-600">No leads found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
