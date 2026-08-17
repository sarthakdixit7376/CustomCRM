import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, CheckCircle2, XCircle } from 'lucide-react';
import {
  CustomerList,
  CustomerCard,
  OngoingService,
  PoliciesAndPlans,
  Quotes,
  Claims,
  Documents,
} from '../Components/CustomerTabs';
import NewCustomerModal from '../Components/CustomerTabs/NewCustomerModal';
import type { CustomerFormData } from '../Components/CustomerTabs/NewCustomerModal';
import PolicyFormModal from '../Components/CustomerTabs/PolicyFormModal';
import type { CustomerRow, SearchField } from '../Components/CustomerTabs/CustomerList';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

/* ───────── Tab Definitions ───────── */
const TABS = [
  { key: 'list', label: 'Customer List', badge: null as number | null },
  { key: 'card', label: 'Customer Card', badge: null },
  { key: 'service', label: 'Ongoing Service', badge: null },
  { key: 'policies', label: 'Policies & Plans', badge: null },
  { key: 'quotes', label: 'Quotes', badge: null },
  { key: 'claims', label: 'Claims', badge: null },
  { key: 'documents', label: 'Documents', badge: null },
] as const;

type TabKey = (typeof TABS)[number]['key'];

interface Toast { id: number; message: string; type: 'success' | 'error'; }

/* ───────── Customer Page ───────── */
export default function CustomersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<TabKey>('list');
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [rawCustomers, setRawCustomers] = useState<any[]>([]);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchField, setCustomerSearchField] = useState<SearchField>('all');
  const [customerPolicyTypeFilter, setCustomerPolicyTypeFilter] = useState('All');
  const [customerCompanyFilter, setCustomerCompanyFilter] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [startCardInEditMode, setStartCardInEditMode] = useState(false);
  const [viewedPolicyCustomer, setViewedPolicyCustomer] = useState<{ id: string; customerName: string } | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [policies, setPolicies] = useState<any[]>([]);
  const [policyModal, setPolicyModal] = useState<{ customer: { id: string; customerName: string }; policy: any | null } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const mapCustomerRow = (cust: any): CustomerRow => {
    const policies = cust.policies || [];
    const hasActive = policies.some((p: any) => (p.status || 'Active') === 'Active');
    return {
      id: cust.id,
      customerNationalId: cust.customerNationalId,
      customerName: cust.customerName,
      email: cust.email || '',
      insuranceAgent: cust.insuranceAgent || '-',
      agentName: cust.agentName || '-',
      policyCount: policies.length,
      status: policies.length === 0 ? 'No Policies' : hasActive ? 'Active' : 'Inactive',
      policyTypes: [...new Set(policies.map((p: any) => p.policyType).filter(Boolean))] as string[],
      insuranceCompanies: [...new Set(policies.map((p: any) => p.insuranceCompany).filter(Boolean))] as string[],
      carNumbers: [...new Set(policies.map((p: any) => p.carNumber).filter(Boolean))] as string[],
      assignedAgentId: cust.agentId || undefined,
      assignedAgentName: cust.agent?.name,
    };
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/customers`);
      setRawCustomers(response.data);
      setCustomers(response.data.map(mapCustomerRow));
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    axios.get(`${API_BASE}/api/policies`)
      .then(res => setPolicies(res.data))
      .catch(err => console.error('Failed to load policies', err));
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    axios.get(`${API_BASE}/api/users`)
      .then(res => setAgents(res.data.filter((u: any) => u.isActive).map((u: any) => ({ id: u.id, name: u.name }))))
      .catch(err => console.error('Failed to load agents', err));
  }, [isAdmin]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const handleAddCustomer = async (data: CustomerFormData) => {
    try {
      const newCustomer = {
        customerNationalId: Number(data.customerNationalId),
        customerName: `${data.firstName} ${data.lastName}`,
        email: data.email || undefined,
        insuranceAgent: data.insuranceCompany,
        agentName: data.agentName,
        agentId: data.assignedAgentId || undefined,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        policies: [
          {
            policyNumber: data.policyNumber,
            policyType: data.policyType,
            insuranceCompany: data.insuranceCompany || 'Unassigned',
            agentName: data.agentName,
            carNumber: data.carNumber,
            glassAndMoreSelected: data.glassAndMoreSelected,
            complementaryVipSelected: data.complementaryVipSelected,
            amountPaid: data.amountPaid,
            startDate: data.startDate || undefined,
            endDate: data.endDate || undefined,
            type: data.insuranceType,
            status: 'Active'
          }
        ]
      };
      await axios.post(`${API_BASE}/api/customers`, newCustomer);
      setIsNewModalOpen(false);
      showToast(`Customer "${data.firstName} ${data.lastName}" added successfully!`);
      fetchCustomers();
    } catch (error) {
      showToast('Error adding customer', 'error');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      await axios.delete(`${API_BASE}/api/customers/${id}`);
      showToast(`Customer has been deleted.`);
      fetchCustomers();
    } catch (error) {
      showToast('Error deleting customer', 'error');
    }
  };

  const handleSelectCustomer = (customer: CustomerRow) => {
    // Pass the full customer object based on ID
    const fullCustomer = rawCustomers.find(c => c.id === customer.id) || customer;
    setSelectedCustomer(fullCustomer);
    setStartCardInEditMode(false);
    setActiveTab('card');
  };

  const handleEditCustomer = (customer: CustomerRow) => {
    const fullCustomer = rawCustomers.find(c => c.id === customer.id) || customer;
    setSelectedCustomer(fullCustomer);
    setStartCardInEditMode(true);
    setActiveTab('card');
  };

  const handleCustomerUpdated = (updated: any) => {
    setSelectedCustomer(updated);
    setRawCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? mapCustomerRow(updated) : c)));
  };

  const openAddPolicyModal = (customer: { id: string; customerName: string }) => {
    setPolicyModal({ customer, policy: null });
  };

  const handleEditPolicy = (policy: any) => {
    setPolicyModal({ customer: { id: policy.customerId, customerName: policy.customer?.customerName || '' }, policy });
  };

  const handlePolicySaved = (policy: any) => {
    const wasAdd = !policyModal?.policy;
    setPolicies((prev) => {
      const exists = prev.some((p) => p.id === policy.id);
      return exists ? prev.map((p) => (p.id === policy.id ? policy : p)) : [policy, ...prev];
    });
    if (wasAdd && policyModal) {
      setViewedPolicyCustomer(policyModal.customer);
      setActiveTab('policies');
    }
    setPolicyModal(null);
  };

  const handleDeletePolicy = (policyId: string) => {
    setPolicies((prev) => prev.filter((p) => p.id !== policyId));
  };

  const handleViewPolicies = (customer: CustomerRow | null) => {
    setViewedPolicyCustomer(customer ? { id: customer.id, customerName: customer.customerName } : null);
  };

  const handleAssignAgent = async (customerId: string, agentId: string) => {
    try {
      const res = await axios.patch(`${API_BASE}/api/customers/${customerId}/agent`, { agentId });
      handleCustomerUpdated(res.data);
    } catch (error) {
      console.error('Failed to reassign customer:', error);
      showToast('Error reassigning customer', 'error');
    }
  };

  const tabsWithBadge = TABS.map((tab) => ({
    ...tab,
    badge: tab.key === 'list' ? rawCustomers.length : tab.badge,
  }));

  return (
    <div className="font-sans bg-surface-muted text-text h-full flex flex-col">
      <div className="px-8 pt-6 pb-2 border-b border-border flex items-center justify-between gap-3 flex-wrap max-md:px-4 max-md:pt-4">
        <div>
          <h1 className="text-2xl font-bold text-text max-md:text-xl">Customers</h1>
          <p className="text-sm text-text-muted mt-1 max-md:text-xs">Manage your clients and their policies</p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary-600 text-white border-none cursor-pointer transition-all duration-150 hover:bg-primary-700 hover:-translate-y-px hover:shadow-card max-md:px-4 max-md:py-2"
          onClick={() => setIsNewModalOpen(true)}
        >
          <Plus size={16} strokeWidth={2.5} /> New Customer
        </button>
      </div>

      {/* Tabs */}
      <nav className="px-8 pt-5 flex items-center gap-1 overflow-x-auto relative border-b border-border max-md:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabsWithBadge.map((tab) => (
          <button
            key={tab.key}
            className={`relative px-4 py-2.5 text-[13px] font-medium bg-transparent border-none rounded-t-md cursor-pointer whitespace-nowrap transition-all duration-150 ${
              activeTab === tab.key
                ? 'text-primary-700 bg-primary-50 font-semibold'
                : 'text-text-muted hover:text-text hover:bg-neutral-50'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.badge !== null && (
              <span className={`ml-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                activeTab === tab.key ? 'bg-primary-600/15 text-primary-700' : 'bg-neutral-100 text-text-muted'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Content */}
      {activeTab === 'list' && (
        <CustomerList
          customers={customers}
          onDeleteCustomer={handleDeleteCustomer}
          onSelectCustomer={handleSelectCustomer}
          onEditCustomer={handleEditCustomer}
          onAddPolicy={openAddPolicyModal}
          onViewPolicies={handleViewPolicies}
          onAssignAgent={handleAssignAgent}
          viewedCustomerId={viewedPolicyCustomer?.id ?? null}
          isAdmin={isAdmin}
          agents={agents}
          searchQuery={customerSearchQuery}
          onSearchQueryChange={setCustomerSearchQuery}
          searchField={customerSearchField}
          onSearchFieldChange={setCustomerSearchField}
          selectedPolicyType={customerPolicyTypeFilter}
          onSelectedPolicyTypeChange={setCustomerPolicyTypeFilter}
          selectedCompany={customerCompanyFilter}
          onSelectedCompanyChange={setCustomerCompanyFilter}
        />
      )}
      {activeTab === 'card' && <CustomerCard customer={selectedCustomer} lead={null} onCustomerUpdated={handleCustomerUpdated} startInEditMode={startCardInEditMode} />}
      {activeTab === 'service' && <OngoingService />}
      {activeTab === 'policies' && (
        <PoliciesAndPlans
          policies={policies}
          filterCustomer={viewedPolicyCustomer}
          onAddPolicy={openAddPolicyModal}
          onEditPolicy={handleEditPolicy}
          onDeletePolicy={handleDeletePolicy}
        />
      )}
      {activeTab === 'quotes' && <Quotes />}
      {activeTab === 'claims' && <Claims />}
      {activeTab === 'documents' && <Documents />}

      {/* New Customer Modal */}
      <NewCustomerModal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} onSubmit={handleAddCustomer} agents={agents} />

      {/* Add / Edit Policy Modal */}
      <PolicyFormModal
        isOpen={policyModal !== null}
        customer={policyModal?.customer ?? null}
        policy={policyModal?.policy ?? null}
        onClose={() => setPolicyModal(null)}
        onSaved={handlePolicySaved}
      />

      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[1000] max-md:left-4 max-md:right-4 max-md:bottom-4">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-5 py-3.5 bg-surface border border-border rounded-lg text-text text-sm font-medium shadow-dropdown animate-fade-in-up ${
                toast.type === 'success' ? 'border-l-4 border-l-success-500' : 'border-l-4 border-l-danger-500'
              }`}
            >
              {toast.type === 'success'
                ? <CheckCircle2 size={18} className="text-success-500 shrink-0" />
                : <XCircle size={18} className="text-danger-500 shrink-0" />}
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
