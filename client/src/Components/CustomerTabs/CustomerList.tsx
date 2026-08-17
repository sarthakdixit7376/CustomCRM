import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, X, Trash2, ChevronLeft, ChevronRight, FilePlus2, Mail, Home, Car, Plane, Pencil } from 'lucide-react';
import DeleteCustomerModal from './DeleteCustomerModal';

/* ───────── Types ───────── */
export interface CustomerRow {
  id: string;
  customerNationalId?: number;
  customerName: string;
  email?: string;
  insuranceAgent: string;
  agentName: string;
  policyCount: number;
  status: 'Active' | 'Inactive' | 'No Policies';
  policyTypes: string[];
  insuranceCompanies: string[];
  carNumbers: string[];
  assignedAgentId?: string;
  assignedAgentName?: string;
}

interface AgentOption {
  id: string;
  name: string;
}

export interface CustomerListProps {
  customers: CustomerRow[];
  onDeleteCustomer: (id: string) => void;
  onSelectCustomer?: (customer: CustomerRow) => void;
  onEditCustomer?: (customer: CustomerRow) => void;
  onAddPolicy?: (customer: CustomerRow) => void;
  onViewPolicies?: (customer: CustomerRow | null) => void;
  onAssignAgent?: (customerId: string, agentId: string) => Promise<void> | void;
  viewedCustomerId?: string | null;
  isAdmin?: boolean;
  agents?: AgentOption[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  searchField: SearchField;
  onSearchFieldChange: (field: SearchField) => void;
  selectedPolicyType: string;
  onSelectedPolicyTypeChange: (value: string) => void;
  selectedCompany: string;
  onSelectedCompanyChange: (value: string) => void;
}

/* ───────── Filter Options ───────── */
const POLICY_TYPES = ['All', 'Car', 'Home', 'Travel'];
const INSURANCE_COMPANIES = ['All', 'Phoenix', 'Clal', 'Migdal', 'Ayalon'];

/* ───────── Search Field Options ───────── */
export type SearchField = 'all' | 'customerName' | 'customerNationalId' | 'email' | 'insuranceAgent' | 'agentName' | 'assignedAgentName' | 'carNumber';

const SEARCH_FIELD_OPTIONS: { value: SearchField; label: string; placeholder: string }[] = [
  { value: 'all', label: 'All Fields', placeholder: 'Search by national ID, name, email, agent, car number...' },
  { value: 'customerName', label: 'Customer Name', placeholder: 'Search by customer name...' },
  { value: 'customerNationalId', label: 'National ID', placeholder: 'Search by customer national ID...' },
  { value: 'email', label: 'Email', placeholder: 'Search by email...' },
  { value: 'insuranceAgent', label: 'Insurance Agent', placeholder: 'Search by insurance agent...' },
  { value: 'agentName', label: 'Agent Name', placeholder: 'Search by agent name...' },
  { value: 'assignedAgentName', label: 'Assigned Agent', placeholder: 'Search by assigned agent...' },
  { value: 'carNumber', label: 'Car Number', placeholder: 'Search by car number...' },
];

/** Returns the searchable text for a single field of a row, used by the search-scope dropdown. */
const getSearchFieldValue = (row: CustomerRow, field: SearchField): string => {
  switch (field) {
    case 'customerName': return row.customerName;
    case 'customerNationalId': return row.customerNationalId != null ? String(row.customerNationalId) : '';
    case 'email': return row.email ?? '';
    case 'insuranceAgent': return row.insuranceAgent;
    case 'agentName': return row.agentName;
    case 'assignedAgentName': return row.assignedAgentName ?? '';
    case 'carNumber': return row.carNumbers.join(' ');
    case 'all': return [row.id, row.customerNationalId, row.customerName, row.email, row.insuranceAgent, row.agentName, row.assignedAgentName, ...row.carNumbers]
      .filter((v) => v != null).join(' ');
  }
};

/** Icons shown in the Policy Type column, one per distinct policy type the customer holds. */
const POLICY_TYPE_ORDER = ['Car', 'Home', 'Travel'];
const POLICY_TYPE_ICONS: Record<string, typeof Home> = {
  Home,
  Car,
  Travel: Plane,
};

/* ───────── Component ───────── */
export default function CustomerList({
  customers, onDeleteCustomer, onSelectCustomer, onEditCustomer, onAddPolicy, onViewPolicies, onAssignAgent,
  viewedCustomerId = null, isAdmin = false, agents = [],
  searchQuery, onSearchQueryChange, searchField, onSearchFieldChange,
  selectedPolicyType: selectedType, onSelectedPolicyTypeChange: setSelectedType,
  selectedCompany, onSelectedCompanyChange: setSelectedCompany,
}: CustomerListProps) {
  const navigate = useNavigate();
  const [showSearchFieldDropdown, setShowSearchFieldDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomerRow | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const handleViewPoliciesToggle = (row: CustomerRow, checked: boolean) => {
    onViewPolicies?.(checked ? row : null);
  };

  const handleAssignAgent = async (customerId: string, agentId: string) => {
    if (!onAssignAgent) return;
    setAssigningId(customerId);
    try {
      await onAssignAgent(customerId, agentId);
    } finally {
      setAssigningId(null);
    }
  };

  const filteredData = customers.filter((row) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || getSearchFieldValue(row, searchField).toLowerCase().includes(q);
    const matchesType = selectedType === 'All' || row.policyTypes.includes(selectedType);
    const matchesCompany = selectedCompany === 'All' || row.insuranceCompanies.includes(selectedCompany);
    return matchesSearch && matchesType && matchesCompany;
  });

  const activeSearchField = SEARCH_FIELD_OPTIONS.find((f) => f.value === searchField)!;

  const handleDeleteConfirm = () => {
    if (deleteTarget) { onDeleteCustomer(deleteTarget.id); setDeleteTarget(null); }
  };

  const statusBadgeClass = (status: CustomerRow['status']) =>
    status === 'Active' ? 'bg-success-50 text-success-600' : 'bg-neutral-100 text-text-muted';
  const statusDotClass = (status: CustomerRow['status']) =>
    status === 'Active' ? 'bg-success-500' : 'bg-neutral-400';

  return (
    <>
      {/* Toolbar */}
      <div className="px-8 py-4 flex flex-wrap items-center gap-3 border-b border-border max-md:flex-col max-md:items-stretch max-md:px-4">
        {/* Search */}
        <div className="flex flex-1 min-w-[280px] max-w-[520px] max-md:max-w-full">
          <div className="relative shrink-0">
            <button
              className="h-full flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium text-text-muted bg-neutral-50 border border-border border-r-0 rounded-l-lg cursor-pointer whitespace-nowrap transition-colors hover:bg-neutral-100 hover:text-text"
              onClick={() => { setShowSearchFieldDropdown(!showSearchFieldDropdown); setShowTypeDropdown(false); setShowCompanyDropdown(false); }}
            >
              {activeSearchField.label} <ChevronDown size={14} />
            </button>
            {showSearchFieldDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-lg py-1 min-w-[180px] z-50 shadow-dropdown animate-dropdown-fade-in">
                {SEARCH_FIELD_OPTIONS.map((opt) => (
                  <div key={opt.value}
                    className={`px-4 py-2 text-[13px] cursor-pointer transition-colors hover:bg-neutral-50 ${searchField === opt.value ? 'text-primary-700 bg-primary-50 font-medium' : 'text-text-muted'}`}
                    onClick={() => { onSearchFieldChange(opt.value); setShowSearchFieldDropdown(false); }}
                  >{opt.label}</div>
                ))}
              </div>
            )}
          </div>
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              className="w-full py-2.5 pr-4 pl-10 text-sm text-text bg-surface border border-border rounded-r-lg outline-none transition-all placeholder:text-neutral-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              placeholder={activeSearchField.placeholder}
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 max-md:flex-wrap">
          {/* Policy Type */}
          <div className="relative">
            <button
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium rounded-lg cursor-pointer transition-all whitespace-nowrap ${
                selectedType !== 'All'
                  ? 'bg-primary-600 text-white'
                  : 'text-text-muted bg-surface border border-border hover:bg-neutral-50 hover:text-text'
              }`}
              onClick={() => { setShowTypeDropdown(!showTypeDropdown); setShowCompanyDropdown(false); setShowSearchFieldDropdown(false); }}
            >
              <ChevronDown size={14} /> Policy: {selectedType}
            </button>
            {showTypeDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-lg py-1 min-w-[160px] z-50 shadow-dropdown animate-dropdown-fade-in">
                {POLICY_TYPES.map((type) => (
                  <div key={type}
                    className={`px-4 py-2 text-[13px] cursor-pointer transition-colors hover:bg-neutral-50 ${selectedType === type ? 'text-primary-700 bg-primary-50 font-medium' : 'text-text-muted'}`}
                    onClick={() => { setSelectedType(type); setShowTypeDropdown(false); }}
                  >{type}</div>
                ))}
              </div>
            )}
          </div>

          {/* Insurance Company */}
          <div className="relative">
            <button
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium rounded-lg cursor-pointer transition-all whitespace-nowrap ${
                selectedCompany !== 'All'
                  ? 'bg-primary-600 text-white'
                  : 'text-text-muted bg-surface border border-border hover:bg-neutral-50 hover:text-text'
              }`}
              onClick={() => { setShowCompanyDropdown(!showCompanyDropdown); setShowTypeDropdown(false); setShowSearchFieldDropdown(false); }}
            >
              <ChevronDown size={14} /> Company: {selectedCompany}
            </button>
            {showCompanyDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-lg py-1 min-w-[160px] z-50 shadow-dropdown animate-dropdown-fade-in">
                {INSURANCE_COMPANIES.map((company) => (
                  <div key={company}
                    className={`px-4 py-2 text-[13px] cursor-pointer transition-colors hover:bg-neutral-50 ${selectedCompany === company ? 'text-primary-700 bg-primary-50 font-medium' : 'text-text-muted'}`}
                    onClick={() => { setSelectedCompany(company); setShowCompanyDropdown(false); }}
                  >{company}</div>
                ))}
              </div>
            )}
          </div>

          {/* Clear */}
          {(selectedType !== 'All' || selectedCompany !== 'All' || searchField !== 'all') && (
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium text-text-muted bg-surface border border-border rounded-lg cursor-pointer transition-all hover:bg-neutral-50 hover:text-text"
              onClick={() => { setSelectedType('All'); setSelectedCompany('All'); onSearchFieldChange('all'); }}
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="text-xs text-text-muted whitespace-nowrap ml-auto">
          Showing <span className="text-text font-semibold">{filteredData.length}</span> of{' '}
          <span className="text-text font-semibold">{customers.length}</span> records
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-8 pb-8 max-md:px-4 max-md:pb-4 mt-8">
        <div className="border border-border rounded-lg overflow-x-auto bg-surface shadow-card mt-0 animate-fade-in-up">
          <table className="w-full border-collapse table-auto">
            <thead className="sticky top-0 z-[2]">
              <tr>
                <th className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border select-none" style={{ width: 40 }}>
                  <input type="checkbox" className="w-4 h-4 accent-primary-600 cursor-pointer" />
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border select-none whitespace-nowrap" style={{ width: 50 }}>Customer ID</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border select-none whitespace-nowrap">Customer National ID</th>
                {['Customer', 'Email', 'Insurance Agent', 'Agent Name', 'Assigned Agent', 'No. of Policies', 'Policy Type', 'Status'].map((h) => (
                  <th key={h} className="group px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border whitespace-nowrap select-none cursor-pointer hover:text-text transition-colors">
                    <span className="inline-flex items-center gap-1.5">{h} <ChevronDown size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" /></span>
                  </th>
                ))}
                <th className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border" style={{ width: 60 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((row, index) => (
                  <tr key={row.id} className="transition-colors hover:bg-neutral-50">
                    <td className="px-4 py-3 text-sm text-text-muted border-b border-border whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-primary-600 cursor-pointer"
                        title="View this customer's policies in Policies & Plans"
                        checked={viewedCustomerId === row.id}
                        onChange={(e) => handleViewPoliciesToggle(row, e.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted border-b border-border whitespace-nowrap">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-text-muted border-b border-border whitespace-nowrap font-mono">{row.customerNationalId ?? '—'}</td>
                    <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap">
                      <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onSelectCustomer?.(row)}>
                        <div className="w-7 h-7 rounded-md bg-primary-50 border border-primary-100 flex items-center justify-center text-[11px] font-bold text-primary-700 shrink-0">
                          {row.customerName.charAt(0)}
                        </div>
                        <span className="text-text font-medium">{row.customerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted border-b border-border whitespace-nowrap">{row.email || '-'}</td>
                    <td className="px-4 py-3 text-sm text-text-muted border-b border-border whitespace-nowrap">{row.insuranceAgent}</td>
                    <td className="px-4 py-3 text-sm text-text-muted border-b border-border whitespace-nowrap">{row.agentName}</td>
                    <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap">
                      {isAdmin ? (
                        <select
                          value={row.assignedAgentId || ''}
                          disabled={assigningId === row.id}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleAssignAgent(row.id, e.target.value)}
                          className="bg-surface border border-border rounded-md text-xs text-text px-2 py-1.5 cursor-pointer hover:border-neutral-300 focus:outline-none focus:border-primary-400 disabled:opacity-50 disabled:cursor-wait"
                          title="Reassign customer"
                        >
                          {!row.assignedAgentId && <option value="" disabled>Select agent…</option>}
                          {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>{agent.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-text-muted">{row.assignedAgentName || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-text font-medium border-b border-border whitespace-nowrap">{row.policyCount}</td>
                    <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap">
                      {row.policyTypes.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          {POLICY_TYPE_ORDER.filter((t) => row.policyTypes.includes(t)).map((t) => {
                            const Icon = POLICY_TYPE_ICONS[t];
                            return <span key={t} title={t}><Icon size={18} className="text-primary-600" /></span>;
                          })}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${statusBadgeClass(row.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass(row.status)}`} />
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          className="text-text-muted hover:text-primary-600 bg-transparent border-none cursor-pointer transition-colors p-1.5 rounded hover:bg-primary-50"
                          title="Edit customer"
                          onClick={() => onEditCustomer?.(row)}
                        ><Pencil size={16} /></button>
                        <button
                          className="text-text-muted hover:text-primary-600 bg-transparent border-none cursor-pointer transition-colors p-1.5 rounded hover:bg-primary-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          title={row.email ? `Email ${row.customerName}` : 'No email on file'}
                          disabled={!row.email}
                          onClick={() => row.email && navigate(`/email?search=${encodeURIComponent(row.email)}`)}
                        ><Mail size={16} /></button>
                        <button
                          className="text-text-muted hover:text-primary-600 bg-transparent border-none cursor-pointer transition-colors p-1.5 rounded hover:bg-primary-50"
                          title="Add policy for this customer"
                          onClick={() => onAddPolicy?.(row)}
                        ><FilePlus2 size={16} /></button>
                        <button
                          className="text-text-muted hover:text-danger-600 bg-transparent border-none cursor-pointer transition-colors p-1.5 rounded hover:bg-danger-50"
                          title="Delete customer"
                          onClick={() => setDeleteTarget(row)}
                        ><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="text-center py-10 text-text-muted">No results found</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-neutral-50 border-t border-border text-xs text-text-muted flex-wrap gap-2">
            <div className="flex items-center gap-2">
              Rows per page:
              <select className="px-2 py-1 text-xs text-text bg-surface border border-border rounded outline-none cursor-pointer" defaultValue={10}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center text-text-muted bg-transparent border-none rounded cursor-pointer transition-all hover:bg-neutral-200 disabled:opacity-30" disabled><ChevronLeft size={14} /></button>
              <button className="w-8 h-8 text-sm font-semibold text-white bg-primary-600 rounded cursor-pointer">1</button>
              <button className="w-8 h-8 flex items-center justify-center text-text-muted bg-transparent border-none rounded cursor-pointer transition-all hover:bg-neutral-200 disabled:opacity-30" disabled><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteCustomerModal
        isOpen={deleteTarget !== null}
        customerName={deleteTarget?.customerName ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
