import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../../config';

export interface LeadRow {
  id: string;
  createdAt?: string;
  pdfUrl?: string;
  leadName: string;
  phoneNumber: string;
  vehicleNumber: string;
  engineCc: string;
  registrationNumber: string;
  validUntil: string;
  vehicleType: string;
  vehicleModel: string;
  age?: string;
  dateOfBirth?: string;
  cost?: string;
  yearOfLicenseIssued?: string;
}

export interface LeadProps {
  onSelectLead?: (lead: LeadRow) => void;
}

export default function Lead({ onSelectLead }: LeadProps) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'live' | 'error'>('loading');

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
            vehicleNumber: lead.vehicleNumber || lead.vehicle_number,
            engineCc: lead.engineCc || lead.engine_cc,
            registrationNumber: lead.registrationNumber || lead.registration_number,
            validUntil: lead.validUntil || lead.valid_until,
            vehicleType: lead.vehicleType || lead.vehicle_type,
            vehicleModel: lead.vehicleModel || lead.vehicle_model,
            age: lead.age,
            dateOfBirth: lead.dateOfBirth || lead.date_of_birth,
            cost: lead.cost,
            yearOfLicenseIssued: lead.yearOfLicenseIssued || lead.year_of_license_issued,
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
      <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950 mt-0 animate-fade-in-up">
        <table className="w-full border-collapse table-auto">
          <thead className="sticky top-0 z-[2]">
            <tr>
              {['Phone Number', 'Lead Name', 'Vehicle Number', 'Engine CC', 'Registration Number', 'Valid Until', 'Vehicle Type', 'Vehicle Model', 'Age', 'Date of Birth', 'Cost', 'Year of License Issued'].map((h) => (
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
                <td colSpan={13} className="p-0 border-b border-neutral-800/50">
                  <div className="flex w-full">
                    {Array.from({ length: 13 }).map((_, i) => (
                      <div key={i} className="flex-1 px-4 py-3">
                        <div className="h-4 bg-neutral-800 rounded w-full"></div>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ) : status === 'error' && leads.length === 0 ? (
              <tr>
                <td colSpan={13} className="text-center py-10 text-red-500 text-sm">
                  Could not reach the leads API — retrying...
                </td>
              </tr>
            ) : leads.length > 0 ? (
              leads.map((row) => (
                <tr key={row.id} className="transition-colors even:bg-[#050505] hover:bg-neutral-900">
                  <td className="px-4 py-3 text-sm text-neutral-300 border-b border-neutral-800/50 whitespace-nowrap font-medium">{row.phoneNumber}</td>
                  <td className="px-4 py-3 text-sm border-b border-neutral-800/50 whitespace-nowrap">
                    <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onSelectLead?.(row)}>
                      <div className="w-7 h-7 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[11px] font-bold text-neutral-400 shrink-0">
                        {row.leadName ? row.leadName.charAt(0).toUpperCase() : '?'}
                      </div>
                      <span className="text-white font-medium">{row.leadName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">{row.vehicleNumber}</td>
                  <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">{row.engineCc}</td>
                  <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">{row.registrationNumber}</td>
                  <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">{row.validUntil}</td>
                  <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">{row.vehicleType}</td>
                  <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">{row.vehicleModel}</td>
                  <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">{row.age}</td>
                  <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">{row.dateOfBirth}</td>
                  <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">{row.cost}</td>
                  <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">{row.yearOfLicenseIssued}</td>
                  <td className="px-4 py-3 text-sm border-b border-neutral-800/50 whitespace-nowrap text-right">
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
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={13} className="text-center py-10 text-neutral-600">
                  No leads yet — new submissions will appear here automatically
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
