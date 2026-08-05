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
import type { PolicyRow } from '../Components/CustomerTabs/CustomerList';
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
  const [activeTab, setActiveTab] = useState<TabKey>('list');
  const [customers, setCustomers] = useState<PolicyRow[]>([]);
  const [rawCustomers, setRawCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<PolicyRow | null>(null);
  const [policyTargetCustomer, setPolicyTargetCustomer] = useState<{ id: string; customerName: string } | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/customers`);
      setRawCustomers(response.data);
      const mappedPolicies: PolicyRow[] = [];
      response.data.forEach((cust: any) => {
        if (cust.policies && cust.policies.length > 0) {
          cust.policies.forEach((pol: any) => {
            mappedPolicies.push({
              id: cust.id, // Using customer id so we can select the customer
              customerName: cust.customerName,
              email: cust.email || '',
              policyNumber: pol.policyNumber,
              policyType: pol.policyType,
              insuranceCompany: pol.insuranceCompany,
              startDate: pol.startDate || '-',
              endDate: pol.endDate || '-',
              type: pol.type || '-',
              amountPaid: pol.amountPaid != null ? String(pol.amountPaid) : '-',
              status: pol.status || 'Active',
            });
          });
        } else {
          mappedPolicies.push({
            id: cust.id,
            customerName: cust.customerName,
            email: cust.email || '',
            policyNumber: '-',
            policyType: '-',
            insuranceCompany: cust.insuranceAgent || '-',
            startDate: '-',
            endDate: '-',
            type: '-',
            amountPaid: '-',
            status: 'Active',
          });
        }
      });
      setCustomers(mappedPolicies);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const handleAddCustomer = async (data: CustomerFormData) => {
    try {
      const newCustomer = {
        customerName: `${data.firstName} ${data.lastName}`,
        email: data.email || undefined,
        insuranceAgent: data.insuranceCompany,
        agentName: data.agentName,
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

  const handleSelectCustomer = (customer: PolicyRow) => {
    // Pass the full customer object based on ID
    const fullCustomer = rawCustomers.find(c => c.id === customer.id) || customer;
    setSelectedCustomer(fullCustomer);
    setActiveTab('card');
  };

  const handleAddPolicyForCustomer = (customer: PolicyRow) => {
    setPolicyTargetCustomer({ id: customer.id, customerName: customer.customerName });
    setActiveTab('policies');
  };

  const tabsWithBadge = TABS.map((tab) => ({
    ...tab,
    badge: tab.key === 'list' ? rawCustomers.length : tab.badge,
  }));

  const TAB_COMPONENTS: Record<TabKey, React.FC> = {
    list: () => <CustomerList customers={customers} onDeleteCustomer={handleDeleteCustomer} onSelectCustomer={handleSelectCustomer} onAddPolicy={handleAddPolicyForCustomer} />,
    card: () => <CustomerCard customer={selectedCustomer} lead={null} />,
    service: OngoingService, policies: () => <PoliciesAndPlans presetCustomer={policyTargetCustomer} />, quotes: Quotes, claims: Claims, documents: Documents,
  };

  const ActiveTabComponent = TAB_COMPONENTS[activeTab];

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
            onClick={() => { setActiveTab(tab.key); setPolicyTargetCustomer(null); }}
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
      <ActiveTabComponent />

      {/* New Customer Modal */}
      <NewCustomerModal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} onSubmit={handleAddCustomer} />

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
