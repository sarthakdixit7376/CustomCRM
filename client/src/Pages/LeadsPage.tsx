import { Lead } from '../Components/CustomerTabs';
import type { LeadRow } from '../Components/CustomerTabs/Lead';

export default function LeadsPage() {
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
      <Lead onSelectLead={handleSelectLead} />
    </div>
  );
}
