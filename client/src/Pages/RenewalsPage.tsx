import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RefreshCw as RefreshIcon } from 'lucide-react';
import { API_BASE } from '../config';
import { Renewals } from '../Components/CustomerTabs';
import DateRangeFilter, { toDateInputValue } from '../Components/DateRangeFilter';

type DatePreset = 'expiring_soon' | 'day' | 'month' | 'year' | 'custom' | 'all';

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'expiring_soon', label: 'Expiring Soon (30 Days)' },
  { key: 'day', label: 'Today' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
  { key: 'custom', label: 'Custom Range' },
  { key: 'all', label: 'All Policies' },
];

/** Computes the effective {startDate, endDate} (YYYY-MM-DD, inclusive) for a preset. */
function computeDateRange(preset: DatePreset, customFrom: string, customTo: string): { startDate?: string; endDate?: string } {
  const now = new Date();
  switch (preset) {
    case 'expiring_soon': {
      // No lower bound, so already-overdue/expired policies stay visible too.
      const end = new Date(now);
      end.setDate(end.getDate() + 30);
      return { endDate: toDateInputValue(end) };
    }
    case 'day': {
      const today = toDateInputValue(now);
      return { startDate: today, endDate: today };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: toDateInputValue(start), endDate: toDateInputValue(end) };
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { startDate: toDateInputValue(start), endDate: toDateInputValue(end) };
    }
    case 'custom':
      return { startDate: customFrom || undefined, endDate: customTo || undefined };
    case 'all':
    default:
      return {};
  }
}

export default function RenewalsPage() {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState<DatePreset>('expiring_soon');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    axios.get(`${API_BASE}/api/policies`)
      .then((res) => setPolicies(res.data))
      .catch((err) => console.error('Failed to load policies', err))
      .finally(() => setLoading(false));
  }, []);

  const handlePolicyUpdated = (policy: any) => {
    setPolicies((prev) => prev.map((p) => (p.id === policy.id ? policy : p)));
  };

  const { startDate, endDate } = computeDateRange(datePreset, customFrom, customTo);
  const filteredPolicies = policies.filter((p) => {
    if (!startDate && !endDate) return true;
    if (!p.endDate) return false;
    const end = toDateInputValue(new Date(p.endDate));
    if (startDate && end < startDate) return false;
    if (endDate && end > endDate) return false;
    return true;
  });

  return (
    <div className="font-sans bg-surface-muted text-text h-full flex flex-col">
      <div className="px-8 pt-6 pb-2 border-b border-border max-md:px-4 max-md:pt-4">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2.5 max-md:text-xl">
          <RefreshIcon size={24} className="text-primary-600" /> Renewal
        </h1>
        <p className="text-sm text-text-muted mt-1 max-md:text-xs">Every customer's policy, with renewal status and assigned agent</p>
      </div>

      <DateRangeFilter
        presets={DATE_PRESETS}
        activePreset={datePreset}
        onPresetChange={(preset) => setDatePreset(preset as DatePreset)}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      />

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-text-muted"><RefreshIcon size={20} className="animate-spin" /></div>
      ) : (
        <Renewals
          policies={filteredPolicies}
          onSelectCustomer={(customer) => navigate(`/customers?openCustomerId=${customer.id}`)}
          onPolicyUpdated={handlePolicyUpdated}
        />
      )}
    </div>
  );
}
