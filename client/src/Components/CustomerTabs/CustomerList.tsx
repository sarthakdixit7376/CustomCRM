import { useState } from 'react';
import { Search, ChevronDown, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import DeleteCustomerModal from './DeleteCustomerModal';

/* ───────── Types ───────── */
export interface PolicyRow {
  id: string;
  customerName: string;
  policyNumber: string;
  policyType: string;
  insuranceCompany: string;
  startDate: string;
  endDate: string;
  type: string;
  status: 'Active' | 'Cancelled';
}

export interface CustomerListProps {
  customers: PolicyRow[];
  onDeleteCustomer: (id: string) => void;
  onSelectCustomer?: (customer: PolicyRow) => void;
}

/* ───────── Filter Options ───────── */
const POLICY_TYPES = ['All', 'Mandatory', 'Comprehensive', 'Life', 'Home'];
const INSURANCE_COMPANIES = ['All', 'Phoenix', 'Clal', 'Migdal', 'Ayalon'];

/* ───────── Helpers ───────── */
const formatDate = (value: string): string => {
  if (!value || value === '-') return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

/* ───────── Component ───────── */
export default function CustomerList({ customers, onDeleteCustomer, onSelectCustomer }: CustomerListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PolicyRow | null>(null);

  const filteredData = customers.filter((row) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' ||
      row.customerName.toLowerCase().includes(q) ||
      row.policyNumber.toLowerCase().includes(q) ||
      row.policyType.toLowerCase().includes(q) ||
      row.insuranceCompany.toLowerCase().includes(q) ||
      row.type.toLowerCase().includes(q);
    const matchesType = selectedType === 'All' || row.policyType === selectedType;
    const matchesCompany = selectedCompany === 'All' || row.insuranceCompany === selectedCompany;
    return matchesSearch && matchesType && matchesCompany;
  });

  const handleDeleteConfirm = () => {
    if (deleteTarget) { onDeleteCustomer(deleteTarget.id); setDeleteTarget(null); }
  };

  return (
    <>
      {/* Toolbar */}
      <div className="px-8 py-4 flex flex-wrap items-center gap-3 border-b border-border max-md:flex-col max-md:items-stretch max-md:px-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-[420px] max-md:max-w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            className="w-full py-2.5 pr-4 pl-10 text-sm text-text bg-surface border border-border rounded-lg outline-none transition-all placeholder:text-neutral-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            placeholder="Search by name, policy, type, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
              onClick={() => { setShowTypeDropdown(!showTypeDropdown); setShowCompanyDropdown(false); }}
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
              onClick={() => { setShowCompanyDropdown(!showCompanyDropdown); setShowTypeDropdown(false); }}
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
          {(selectedType !== 'All' || selectedCompany !== 'All') && (
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium text-text-muted bg-surface border border-border rounded-lg cursor-pointer transition-all hover:bg-neutral-50 hover:text-text"
              onClick={() => { setSelectedType('All'); setSelectedCompany('All'); }}
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
        <div className="border border-border rounded-lg overflow-x-auto hide-scrollbar bg-surface shadow-card mt-0 animate-fade-in-up">
          <table className="w-full border-collapse table-auto">
            <thead className="sticky top-0 z-[2]">
              <tr>
                <th className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border select-none" style={{ width: 40 }}>
                  <input type="checkbox" className="w-4 h-4 accent-primary-600 cursor-pointer" />
                </th>
                {['Customer', 'Policy Number', 'Policy Type', 'Insurance Company', 'Start Date', 'End Date', 'Type', 'Status'].map((h) => (
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
                  <tr key={`${row.id}-${index}`} className="transition-colors hover:bg-neutral-50">
                    <td className="px-4 py-3 text-sm text-text-muted border-b border-border whitespace-nowrap">
                      <input type="checkbox" className="w-4 h-4 accent-primary-600 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap">
                      <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onSelectCustomer?.(row)}>
                        <div className="w-7 h-7 rounded-md bg-primary-50 border border-primary-100 flex items-center justify-center text-[11px] font-bold text-primary-700 shrink-0">
                          {row.customerName.charAt(0)}
                        </div>
                        <span className="text-text font-medium">{row.customerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text border-b border-border whitespace-nowrap font-medium">{row.policyNumber}</td>
                    <td className="px-4 py-3 text-sm text-text-muted border-b border-border whitespace-nowrap">{row.policyType}</td>
                    <td className="px-4 py-3 text-sm text-text-muted border-b border-border whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-info-50 border border-info-100 flex items-center justify-center text-[11px] font-bold text-info-600 shrink-0">
                          {row.insuranceCompany.charAt(0)}
                        </div>
                        {row.insuranceCompany}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted border-b border-border whitespace-nowrap">{formatDate(row.startDate)}</td>
                    <td className="px-4 py-3 text-sm text-text-muted border-b border-border whitespace-nowrap">{formatDate(row.endDate)}</td>
                    <td className="px-4 py-3 text-sm text-text-muted border-b border-border whitespace-nowrap">{row.type}</td>
                    <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${
                        row.status === 'Active' ? 'bg-success-50 text-success-600' : 'bg-neutral-100 text-text-muted'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'Active' ? 'bg-success-500' : 'bg-neutral-400'}`} />
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap">
                      <button
                        className="text-text-muted hover:text-danger-600 bg-transparent border-none cursor-pointer transition-colors p-1.5 rounded hover:bg-danger-50"
                        title="Delete customer"
                        onClick={() => setDeleteTarget(row)}
                      ><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-text-muted">No results found</td>
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
