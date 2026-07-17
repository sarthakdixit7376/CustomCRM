import { useState, useEffect } from 'react';
import axios from 'axios';
import logo from '../assets/Logo.png';
import {
  CustomerList,
  CustomerCard,
  OngoingService,
  PoliciesAndPlans,
  Quotes,
  Claims,
  Documents,
  Lead,
} from '../Components/CustomerTabs';
import NewCustomerModal from '../Components/CustomerTabs/NewCustomerModal';
import type { CustomerFormData } from '../Components/CustomerTabs/NewCustomerModal';
import type { PolicyRow } from '../Components/CustomerTabs/CustomerList';
import type { LeadRow } from '../Components/CustomerTabs/Lead';
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
  { key: 'lead', label: 'Lead', badge: null },
] as const;

type TabKey = (typeof TABS)[number]['key'];

interface Toast { id: number; message: string; type: 'success' | 'error'; }

/* ───────── Customer Page ───────── */
export default function Customer() {
  const [activeTab, setActiveTab] = useState<TabKey>('list');
  const [customers, setCustomers] = useState<PolicyRow[]>([]);
  const [rawCustomers, setRawCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<PolicyRow | null>(null);
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
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
              policyNumber: pol.policyNumber,
              policyType: pol.policyType,
              insuranceCompany: pol.insuranceCompany,
              startDate: pol.startDate || '-',
              endDate: pol.endDate || '-',
              type: pol.type || '-',
              status: pol.status || 'Active',
            });
          });
        } else {
          mappedPolicies.push({
            id: cust.id,
            customerName: cust.customerName,
            policyNumber: '-',
            policyType: '-',
            insuranceCompany: cust.insuranceAgent || '-',
            startDate: '-',
            endDate: '-',
            type: '-',
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
        insuranceAgent: data.insuranceCompany,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        policies: [
          {
            policyNumber: data.policyNumber,
            policyType: data.policyType,
            insuranceCompany: data.insuranceCompany || 'Unassigned',
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
    setSelectedLead(null);
    setActiveTab('card');
  };

  const handleSelectLead = (lead: LeadRow) => {
    setSelectedLead(lead);
    setSelectedCustomer(null);
    setActiveTab('card');
  };

  const tabsWithBadge = TABS.map((tab) => ({
    ...tab,
    badge: tab.key === 'list' ? rawCustomers.length : tab.badge,
  }));

  const TAB_COMPONENTS: Record<TabKey, React.FC> = {
    list: () => <CustomerList customers={customers} onDeleteCustomer={handleDeleteCustomer} onSelectCustomer={handleSelectCustomer} />,
    card: () => <CustomerCard customer={selectedCustomer} lead={selectedLead} />,
    service: OngoingService, policies: () => <PoliciesAndPlans />, quotes: Quotes, claims: Claims, documents: Documents, lead: () => <Lead onSelectLead={handleSelectLead} />,
  };

  const ActiveTabComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="font-sans bg-black text-white min-h-screen flex flex-col">

      {/* Header */}
      <header className="px-8 pt-6 pb-0 flex items-center justify-between gap-4 max-md:flex-col max-md:items-start max-md:gap-3 max-md:px-4">
        <div className="flex items-center gap-3.5">
          <img src={logo} alt="MdarAi Logo" className="w-10 h-10 object-contain" />
          <h1 className="text-2xl font-bold tracking-tight m-0">
            <span>Mdar</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">Ai</span>
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-white text-black border-none cursor-pointer transition-all duration-150 hover:bg-neutral-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(255,255,255,0.12)]"
          onClick={() => setIsNewModalOpen(true)}
        >
          <span className="text-lg leading-none">+</span> New Customer
        </button>
      </header>

      {/* Tabs */}
      <nav className="px-8 pt-5 flex items-center gap-1 overflow-x-auto relative border-b border-neutral-800 max-md:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabsWithBadge.map((tab) => (
          <button
            key={tab.key}
            className={`relative px-4 py-2.5 text-[13px] font-medium bg-transparent border-none rounded-t cursor-pointer whitespace-nowrap transition-all duration-150 ${
              activeTab === tab.key
                ? 'text-black bg-white font-semibold'
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.badge !== null && (
              <span className={`ml-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                activeTab === tab.key ? 'bg-black/20 text-black' : 'bg-neutral-800 text-neutral-400'
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
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[1000]">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-5 py-3.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white text-sm font-medium shadow-xl animate-fade-in-up ${
                toast.type === 'success' ? 'border-l-2 border-l-white' : 'border-l-2 border-l-neutral-500'
              }`}
            >
              <span className="text-base">{toast.type === 'success' ? '✅' : '❌'}</span>
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
