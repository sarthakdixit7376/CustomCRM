import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { API_BASE } from '../../config';
import { useAuth } from '../../context/AuthContext';
import LeadDetailSidebar from './LeadDetailSidebar';
import CreateLeadModal from './CreateLeadModal';
import type { LeadFormData } from './CreateLeadModal';

export interface LeadRow {
  id: string;
  leadNationalId?: number;
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
  const totalCols = COLUMNS.length + 2 + (isAdmin ? 1 : 0);

  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'live' | 'error'>('loading');
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [markingContactedId, setMarkingContactedId] = useState<string | null>(null);
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

  const handleMarkContacted = async (leadId: string, e: React.SyntheticEvent) => {
    e.stopPropagation();
    const previous = leads.find(l => l.id === leadId);

    setMarkingContactedId(leadId);
    setLeads(prevLeads => prevLeads.map(l => (l.id === leadId ? { ...l, leadFlowStatus: 'CONTACTED' } : l)));

    try {
      await axios.patch(`${API_BASE}/api/leads/${leadId}/lead-flow-status`, { leadFlowStatus: 'CONTACTED' });
    } catch (error) {
      console.error('Failed to mark lead as contacted:', error);
      alert('Failed to mark lead as contacted');
      if (previous) {
        setLeads(prevLeads => prevLeads.map(l => (l.id === leadId ? previous : l)));
      }
    } finally {
      setMarkingContactedId(null);
    }
  };

  const handleCreateLead = async (formData: LeadFormData) => {
    setIsCreating(true);
    try {
      // The backend looks up the vehicle in the Israeli gov registry server-side using vehicle_number
      const response = await axios.post(`${API_BASE}/api/leads`, formData);

      const newLead = response.data;
      setLeads((prev) => [
        {
          id: newLead.id,
          leadNationalId: newLead.leadNationalId,
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
            leadNationalId: lead.leadNationalId,
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
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="group flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all bg-primary-600 text-white border-none hover:bg-primary-700 hover:-translate-y-px hover:shadow-card max-md:w-full max-md:justify-center"
        >
          <Plus size={16} strokeWidth={2.5} className="transition-transform group-hover:rotate-90" />
          Create New Lead
        </button>
      </div>

      <div className="border border-border rounded-lg overflow-x-auto bg-surface shadow-card mt-0 animate-fade-in-up">
        <table className="w-full border-collapse table-auto">
          <thead className="sticky top-0 z-[2]">
            <tr>
              <th className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border whitespace-nowrap select-none" style={{ width: 50 }}>Lead ID</th>
              <th className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border whitespace-nowrap select-none">Lead National ID</th>
              {COLUMNS.map(([h]) => (
                <th key={h} className="group px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border whitespace-nowrap select-none cursor-pointer hover:text-text transition-colors">
                  <span className="inline-flex items-center gap-1.5">{h} <ChevronDown size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" /></span>
                </th>
              ))}
              {isAdmin && (
                <th className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-right bg-neutral-50 border-b border-border whitespace-nowrap">
                  Actions
                </th>
              )}
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
              leads.map((row, index) => {
                const val = row.leadStatus;
                let colorClass = 'text-text-muted bg-neutral-100 border-neutral-200';
                if (val === 'NEW') colorClass = 'text-info-600 bg-info-50 border-info-100';
                else if (val === 'IN_PROGRESS') colorClass = 'text-amber-600 bg-amber-50 border-amber-100';
                else if (val === 'DONE') colorClass = 'text-success-600 bg-success-50 border-success-100';

                const flowVal = row.leadFlowStatus;
                const flowColorClass = 'text-violet-600 bg-violet-50 border-violet-100';

                return (
                <tr
                  key={row.id}
                  onClick={() => handleRowClick(row)}
                  className="transition-colors hover:bg-neutral-50 cursor-pointer"
                >
                  {/* Row number */}
                  <td className="px-4 py-3 text-sm text-text-muted border-b border-border whitespace-nowrap">{index + 1}</td>
                  {/* Lead National ID */}
                  <td className="px-4 py-3 text-sm text-text-muted border-b border-border whitespace-nowrap font-mono">{row.leadNationalId ?? '—'}</td>
                  {/* Phone Number */}
                  <td className="px-4 py-3 text-sm text-text border-b border-border whitespace-nowrap font-medium">{row.phoneNumber}</td>
                  {/* Lead Name with avatar */}
                  <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-primary-50 border border-primary-100 flex items-center justify-center text-[11px] font-bold text-primary-700 shrink-0">
                        {row.leadName ? row.leadName.charAt(0).toUpperCase() : '?'}
                      </div>
                      <span className="text-text font-medium">{row.leadName}</span>
                    </div>
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap">
                    {val ? (
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${colorClass}`}>
                        {val.replace('_', ' ')}
                      </span>
                    ) : '—'}
                  </td>
                  {/* Flow Status */}
                  <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {flowVal ? (
                        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${flowColorClass}`}>
                          {flowVal.replace(/_/g, ' ')}
                        </span>
                      ) : '—'}
                      {flowVal === 'NEW' && (
                        <button
                          onClick={(e) => handleMarkContacted(row.id, e)}
                          disabled={markingContactedId === row.id}
                          className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline disabled:opacity-50 disabled:cursor-wait bg-transparent border-none cursor-pointer p-0"
                        >
                          Mark as Contacted
                        </button>
                      )}
                    </div>
                  </td>
                  {/* Interested In */}
                  <td className="px-4 py-3 text-sm text-text-muted border-b border-border whitespace-nowrap">
                    {row.interestedIn ? (INTERESTED_IN_LABELS[row.interestedIn] || row.interestedIn) : '—'}
                  </td>
                  {/* Agent Assigned */}
                  <td className="px-4 py-3 text-sm text-text-muted border-b border-border whitespace-nowrap">
                    {row.agentName || '—'}
                  </td>
                  {/* Actions */}
                  {isAdmin && (
                    <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={row.agentId || ''}
                          disabled={assigningId === row.id}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleAssignAgent(row.id, e.target.value, e)}
                          className="bg-surface border border-border rounded-md text-xs text-text px-2 py-1.5 cursor-pointer hover:border-neutral-300 focus:outline-none focus:border-primary-400 disabled:opacity-50 disabled:cursor-wait"
                          title="Reassign lead"
                        >
                          {row.agentId == null && <option value="" disabled>Select agent…</option>}
                          {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>{agent.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={(e) => handleDelete(row.id, e)}
                          className="text-danger-600 hover:text-danger-700 transition-colors p-1.5 rounded hover:bg-danger-50"
                          title="Delete Lead"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={totalCols} className="text-center py-10 text-text-muted">
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
