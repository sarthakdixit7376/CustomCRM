import { useState } from 'react';
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
      <div className="px-8 py-4 flex flex-wrap items-center gap-3 border-b border-neutral-800 max-md:flex-col max-md:items-stretch max-md:px-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-[420px] max-md:max-w-full">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-base pointer-events-none">🔍</span>
          <input
            type="text"
            className="w-full py-2.5 pr-4 pl-10 text-sm text-white bg-neutral-950 border border-neutral-800 rounded-lg outline-none transition-all placeholder:text-neutral-600 focus:border-neutral-600 focus:bg-neutral-900"
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
                  ? 'bg-white text-black'
                  : 'text-neutral-400 bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 hover:text-white'
              }`}
              onClick={() => { setShowTypeDropdown(!showTypeDropdown); setShowCompanyDropdown(false); }}
            >
              <span className="text-sm">▾</span> Policy: {selectedType}
            </button>
            {showTypeDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-neutral-900 border border-neutral-700 rounded-lg py-1 min-w-[160px] z-50 shadow-2xl animate-dropdown-fade-in">
                {POLICY_TYPES.map((type) => (
                  <div key={type}
                    className={`px-4 py-2 text-[13px] cursor-pointer transition-colors hover:bg-neutral-800 ${selectedType === type ? 'text-white bg-neutral-800' : 'text-neutral-400'}`}
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
                  ? 'bg-white text-black'
                  : 'text-neutral-400 bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 hover:text-white'
              }`}
              onClick={() => { setShowCompanyDropdown(!showCompanyDropdown); setShowTypeDropdown(false); }}
            >
              <span className="text-sm">▾</span> Company: {selectedCompany}
            </button>
            {showCompanyDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-neutral-900 border border-neutral-700 rounded-lg py-1 min-w-[160px] z-50 shadow-2xl animate-dropdown-fade-in">
                {INSURANCE_COMPANIES.map((company) => (
                  <div key={company}
                    className={`px-4 py-2 text-[13px] cursor-pointer transition-colors hover:bg-neutral-800 ${selectedCompany === company ? 'text-white bg-neutral-800' : 'text-neutral-400'}`}
                    onClick={() => { setSelectedCompany(company); setShowCompanyDropdown(false); }}
                  >{company}</div>
                ))}
              </div>
            )}
          </div>

          {/* Clear */}
          {(selectedType !== 'All' || selectedCompany !== 'All') && (
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium text-neutral-500 bg-neutral-950 border border-neutral-800 rounded-lg cursor-pointer transition-all hover:bg-neutral-900 hover:text-white"
              onClick={() => { setSelectedType('All'); setSelectedCompany('All'); }}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="text-xs text-neutral-500 whitespace-nowrap ml-auto">
          Showing <span className="text-white font-semibold">{filteredData.length}</span> of{' '}
          <span className="text-white font-semibold">{customers.length}</span> records
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-8 pb-8 max-md:px-4 max-md:pb-4 mt-8">
        <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950 mt-0 animate-fade-in-up">
          <table className="w-full border-collapse table-auto">
            <thead className="sticky top-0 z-[2]">
              <tr>
                <th className="px-4 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-left bg-neutral-900 border-b border-neutral-800 select-none" style={{ width: 40 }}>
                  <input type="checkbox" className="w-4 h-4 accent-white cursor-pointer" />
                </th>
                {['Customer', 'Policy Number', 'Policy Type', 'Insurance Company', 'Start Date', 'End Date', 'Type', 'Status'].map((h) => (
                  <th key={h} className="group px-4 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-left bg-neutral-900 border-b border-neutral-800 whitespace-nowrap select-none cursor-pointer hover:text-neutral-300 transition-colors">
                    <span className="inline-flex items-center gap-1.5">{h} <span className="text-[10px] opacity-0 group-hover:opacity-50 transition-opacity">▾</span></span>
                  </th>
                ))}
                <th className="px-4 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-left bg-neutral-900 border-b border-neutral-800" style={{ width: 60 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((row, index) => (
                  <tr key={`${row.id}-${index}`} className="transition-colors even:bg-[#050505] hover:bg-neutral-900">
                    <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">
                      <input type="checkbox" className="w-4 h-4 accent-white cursor-pointer" />
                    </td>
                    <td className="px-4 py-3 text-sm border-b border-neutral-800/50 whitespace-nowrap">
                      <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onSelectCustomer?.(row)}>
                        <div className="w-7 h-7 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[11px] font-bold text-neutral-400 shrink-0">
                          {row.customerName.charAt(0)}
                        </div>
                        <span className="text-white font-medium">{row.customerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-300 border-b border-neutral-800/50 whitespace-nowrap font-medium">{row.policyNumber}</td>
                    <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">{row.policyType}</td>
                    <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[11px] font-bold text-neutral-400 shrink-0">
                          {row.insuranceCompany.charAt(0)}
                        </div>
                        {row.insuranceCompany}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">{row.startDate}</td>
                    <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">{row.endDate}</td>
                    <td className="px-4 py-3 text-sm text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap">{row.type}</td>
                    <td className="px-4 py-3 text-sm border-b border-neutral-800/50 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${
                        row.status === 'Active' ? 'bg-white/10 text-neutral-200' : 'bg-white/5 text-neutral-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'Active' ? 'bg-white' : 'bg-neutral-600'}`} />
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm border-b border-neutral-800/50 whitespace-nowrap">
                      <button
                        className="text-neutral-600 hover:text-white bg-transparent border-none cursor-pointer transition-colors text-base"
                        title="Delete customer"
                        onClick={() => setDeleteTarget(row)}
                      >🗑️</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-neutral-600">No results found</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-neutral-900 border-t border-neutral-800 text-xs text-neutral-500">
            <div className="flex items-center gap-2">
              Rows per page:
              <select className="px-2 py-1 text-xs text-neutral-300 bg-neutral-950 border border-neutral-800 rounded outline-none cursor-pointer" defaultValue={10}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 text-sm text-neutral-500 bg-transparent border-none rounded cursor-pointer transition-all hover:bg-neutral-800 disabled:opacity-30" disabled>‹</button>
              <button className="w-8 h-8 text-sm font-semibold text-black bg-white rounded cursor-pointer">1</button>
              <button className="w-8 h-8 text-sm text-neutral-500 bg-transparent border-none rounded cursor-pointer transition-all hover:bg-neutral-800 disabled:opacity-30" disabled>›</button>
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
