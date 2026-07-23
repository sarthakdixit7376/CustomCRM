import { useState } from 'react';
import { Lead, LeadQuotes } from '../Components/CustomerTabs';
import type { LeadRow } from '../Components/CustomerTabs/Lead';

const TABS = [
  { key: 'leads', label: 'Leads' },
  { key: 'quotes', label: 'Quotes' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('leads');

  const handleSelectLead = (lead: LeadRow) => {
    // In the future, this will open a Lead detail panel or navigate to a detail route.
    console.log('Selected lead:', lead);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-black">
      <div className="px-8 pt-6 pb-2 border-b border-neutral-800">
        <h1 className="text-2xl font-bold text-white">Leads</h1>
        <p className="text-sm text-neutral-400 mt-1">Manage and track incoming leads</p>
      </div>

      <nav className="px-8 pt-5 flex items-center gap-1 overflow-x-auto relative border-b border-neutral-800 max-md:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => (
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
          </button>
        ))}
      </nav>

      {activeTab === 'leads' ? <Lead onSelectLead={handleSelectLead} /> : <LeadQuotes />}
    </div>
  );
}
