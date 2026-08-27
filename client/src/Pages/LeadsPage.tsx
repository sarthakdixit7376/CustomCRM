import { useSearchParams } from 'react-router-dom';
import { Lead, LeadQuotes } from '../Components/CustomerTabs';

const TABS = [
  { key: 'leads', label: 'Leads' },
  { key: 'quotes', label: 'Quotes' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const isTabKey = (value: string | null): value is TabKey =>
  TABS.some((tab) => tab.key === value);

export default function LeadsPage() {
  // The tab lives in the URL (?tab=quotes) so a refresh, a bookmark or the back
  // button all land the agent back on the tab they were working in.
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: TabKey = isTabKey(tabParam) ? tabParam : 'leads';

  const setActiveTab = (key: TabKey) => {
    setSearchParams(key === 'leads' ? {} : { tab: key });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-muted">
      <div className="px-8 pt-6 pb-2 border-b border-border max-md:px-4 max-md:pt-4">
        <h1 className="text-2xl font-bold text-text max-md:text-xl">Leads</h1>
        <p className="text-sm text-text-muted mt-1 max-md:text-xs">Manage and track incoming leads</p>
      </div>

      <nav className="px-8 pt-5 flex items-center gap-1 overflow-x-auto relative border-b border-border max-md:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => (
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
          </button>
        ))}
      </nav>

      {activeTab === 'leads' ? <Lead /> : <LeadQuotes />}
    </div>
  );
}
