import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../../config';
import { useAuth } from '../../context/AuthContext';
import LeadDetailSidebar from './LeadDetailSidebar';
import CreateLeadModal from './CreateLeadModal';
import type { LeadFormData } from './CreateLeadModal';

export interface LeadRow {
  id: string;
  createdAt?: string;
  pdfUrl?: string;
  pricingPdfUrl?: string;
  leadName: string;
  phoneNumber: string;

  // Assignment
  agentId?: string;
  agentName?: string;

  // Person-specific fields
  leadStatus?: string;
  leadFlowStatus?: string;
  age?: string;
  dateOfBirth?: string;
  cost?: string;
  yearOfLicenseIssued?: string;
  interestedIn?: string;

  // Insurance quote pricing
  mandatoryPrice?: number;
  thirdPartyPrice?: number;
  complimentaryPrice?: number;

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
  ['Status', 'leadStatus'],
  ['Flow Status', 'leadFlowStatus'],
  ['Interested In', 'interestedIn'],
  ['Agent Assigned', 'agentName'],
];

const INTERESTED_IN_LABELS: Record<string, string> = {
  CARS: 'Cars',
  HOME: 'Home',
  BUSINESS: 'Business',
  TRAVEL: 'Travel',
  HEALTH: 'Health',
  OTHER: 'Other',
};

interface Agent {
  id: string;
  name: string;
}

export interface LeadProps {
  onSelectLead?: (lead: LeadRow) => void;
}

export default function Lead({ onSelectLead }: LeadProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const totalCols = COLUMNS.length + (isAdmin ? 1 : 0);

  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'live' | 'error'>('loading');
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleRowClick = (row: LeadRow) => {
    setSelectedLead(row);
    onSelectLead?.(row);
  };

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

  const handleAssignAgent = async (leadId: string, newAgentId: string, e: React.SyntheticEvent) => {
    e.stopPropagation();
    const newAgentName = agents.find(a => a.id === newAgentId)?.name;
    const previous = leads.find(l => l.id === leadId);

    setAssigningId(leadId);
    setLeads(prevLeads => prevLeads.map(l => (l.id === leadId ? { ...l, agentId: newAgentId, agentName: newAgentName } : l)));

    try {
      await axios.patch(`${API_BASE}/api/leads/${leadId}/agent`, { agentId: newAgentId });
    } catch (error) {
      console.error('Failed to reassign lead:', error);
      alert('Failed to reassign lead');
      if (previous) {
        setLeads(prevLeads => prevLeads.map(l => (l.id === leadId ? previous : l)));
      }
    } finally {
      setAssigningId(null);
    }
  };

  const handleCreateLead = async (formData: LeadFormData) => {
    setIsCreating(true);
    try {
      // 1. Fetch vehicle info from the Israeli government vehicle registry
      let vehicleGovData: Record<string, any> = {};
      const vehicleNumber = formData.vehicle_number?.trim();

      if (vehicleNumber) {
        try {
          const govUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=053cea08-09bc-40ec-8f7a-156f0677aff3&filters=${encodeURIComponent(JSON.stringify({ mispar_rechev: Number(vehicleNumber) }))}&limit=1`;
          const govResponse = await axios.get(govUrl, { withCredentials: false });
          const records = govResponse.data?.result?.records;
          if (records && records.length > 0) {
            vehicleGovData = records[0];
          }
        } catch (govError) {
          console.warn('Could not fetch vehicle data from gov API:', govError);
          // Continue with lead creation even if gov API fails
        }
      }

      // 2. Create the lead with form fields + vehicle gov data merged
      const response = await axios.post(`${API_BASE}/api/leads`, {
        ...formData,
        vehicle_gov_data: vehicleGovData,
      });

      const newLead = response.data;
      setLeads((prev) => [
        {
          id: newLead.id,
          createdAt: newLead.createdAt,
          leadName: newLead.leadName || formData.lead_name,
          phoneNumber: newLead.phoneNumber || formData.phone_number,
          leadStatus: newLead.leadStatus,
          leadFlowStatus: newLead.leadFlowStatus,
          age: newLead.age,
          dateOfBirth: newLead.dateOfBirth,
          yearOfLicenseIssued: newLead.yearOfLicenseIssued,
          interestedIn: newLead.interestedIn || formData.interested_in,
          misparRechev: newLead.misparRechev,
          agentId: newLead.agentId,
          agentName: newLead.agent?.name,
          mandatoryPrice: newLead.mandatoryPrice,
          thirdPartyPrice: newLead.thirdPartyPrice,
          complimentaryPrice: newLead.complimentaryPrice,
        },
        ...prev,
      ]);
      setIsCreateModalOpen(false);
    } catch (error: any) {
      console.error('Failed to create lead:', error);
      const status = error?.response?.status;
      if (status === 401) {
        alert('Your session has expired. Please log in again.');
      } else {
        const serverMsg = error?.response?.data?.error;
        alert(serverMsg || 'Failed to create lead. Please try again.');
      }
    } finally {
      setIsCreating(false);
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
            pricingPdfUrl: lead.pricingPdfUrl,
            leadName: lead.leadName || lead.lead_name,
            phoneNumber: lead.phoneNumber || lead.phone_number,

            // Assignment
            agentId: lead.agentId,
            agentName: lead.agent?.name,

            // Person-specific
            leadStatus: lead.leadStatus,
            leadFlowStatus: lead.leadFlowStatus,
            age: lead.age,
            dateOfBirth: lead.dateOfBirth || lead.date_of_birth,
            cost: lead.cost,
            yearOfLicenseIssued: lead.yearOfLicenseIssued || lead.year_of_license_issued,
            interestedIn: lead.interestedIn || lead.interested_in,
            mandatoryPrice: lead.mandatoryPrice,
            thirdPartyPrice: lead.thirdPartyPrice,
            complimentaryPrice: lead.complimentaryPrice,

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

  useEffect(() => {
    if (!isAdmin) return;
    let isMounted = true;

    axios.get(`${API_BASE}/api/users`)
      .then(response => {
        if (!isMounted) return;
        const activeAgents = response.data
          .filter((u: any) => u.isActive)
          .map((u: any) => ({ id: u.id, name: u.name }));
        setAgents(activeAgents);
      })
      .catch(error => console.error('Failed to load agents:', error));

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  return (
    <div className="flex-1 overflow-auto px-8 pb-8 max-md:px-4 max-md:pb-4 mt-8">
      {/* ── Header bar with Create button ── */}
      <div className="flex items-center justify-between mb-4">
        <div />
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="group flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all bg-white text-black border-none hover:bg-neutral-200 hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(255,255,255,0.15)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:rotate-90">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create New Lead
        </button>
      </div>

      <div className="border border-neutral-800 rounded-lg overflow-x-auto hide-scrollbar bg-neutral-950 mt-0 animate-fade-in-up">
        <table className="w-full border-collapse table-auto">
          <thead className="sticky top-0 z-[2]">
            <tr>
              {COLUMNS.map(([h]) => (
                <th key={h} className="group px-4 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-left bg-neutral-900 border-b border-neutral-800 whitespace-nowrap select-none cursor-pointer hover:text-neutral-300 transition-colors">
                  <span className="inline-flex items-center gap-1.5">{h} <span className="text-[10px] opacity-0 group-hover:opacity-50 transition-opacity">▾</span></span>
                </th>
              ))}
              {isAdmin && (
                <th className="px-4 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-right bg-neutral-900 border-b border-neutral-800 whitespace-nowrap">
                  Actions
                </th>
              )}
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
              leads.map((row) => {
                const val = row.leadStatus;
                let colorClass = 'text-neutral-400 bg-neutral-800/50 border-neutral-700';
                if (val === 'NEW') colorClass = 'text-red-500 bg-red-500/10 border-red-500/20';
                else if (val === 'IN_PROGRESS') colorClass = 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
                else if (val === 'DONE') colorClass = 'text-green-500 bg-green-500/10 border-green-500/20';

                const flowVal = row.leadFlowStatus;
                const flowColorClass = 'text-blue-400 bg-blue-500/10 border-blue-500/20';

                return (
                <tr
                  key={row.id}
                  onClick={() => handleRowClick(row)}
                  className="transition-colors even:bg-[#050505] hover:bg-neutral-900 cursor-pointer"
                >
                  {/* Phone Number */}
                  <td className="px-4 py-3 text-sm text-neutral-300 border-b border-neutral-800/50 whitespace-nowrap font-medium">{row.phoneNumber}</td>
                  {/* Lead Name with avatar */}
                  <td className="px-4 py-3 text-sm border-b border-neutral-800/50 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[11px] font-bold text-neutral-400 shrink-0">
                        {row.leadName ? row.leadName.charAt(0).toUpperCase() : '?'}
                      </div>
                      <span className="text-white font-medium">{row.leadName}</span>
                    </div>
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3 text-sm border-b border-neutral-800/50 whitespace-nowrap">
                    {val ? (
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${colorClass}`}>
                        {val.replace('_', ' ')}
                      </span>
                    ) : '—'}
                  </td>
                  {/* Flow Status */}
                  <td className="px-4 py-3 text-sm border-b border-neutral-800/50 whitespace-nowrap">
                    {flowVal ? (
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${flowColorClass}`}>
                        {flowVal.replace(/_/g, ' ')}
                      </span>
                    ) : '—'}
                  </td>
                  {/* Interested In */}
                  <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">
                    {row.interestedIn ? (INTERESTED_IN_LABELS[row.interestedIn] || row.interestedIn) : '—'}
                  </td>
                  {/* Agent Assigned */}
                  <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">
                    {row.agentName || '—'}
                  </td>
                  {/* Actions */}
                  {isAdmin && (
                    <td className="px-4 py-3 text-sm border-b border-neutral-800/50 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={row.agentId || ''}
                          disabled={assigningId === row.id}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleAssignAgent(row.id, e.target.value, e)}
                          className="bg-neutral-900 border border-neutral-700 rounded-md text-xs text-neutral-300 px-2 py-1.5 cursor-pointer hover:border-neutral-600 focus:outline-none focus:border-neutral-500 disabled:opacity-50 disabled:cursor-wait"
                          title="Reassign lead"
                        >
                          {row.agentId == null && <option value="" disabled>Select agent…</option>}
                          {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>{agent.name}</option>
                          ))}
                        </select>
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
                  )}
                </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={totalCols} className="text-center py-10 text-neutral-600">
                  No leads yet — new submissions will appear here automatically
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedLead && (
        <LeadDetailSidebar lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}

      {/* ── Create Lead Modal ── */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateLead}
        isSubmitting={isCreating}
      />
    </div>
  );
}
