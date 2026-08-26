import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, RefreshCw } from 'lucide-react';
import { API_BASE } from '../config';
import BarChart from '../Components/Charts/BarChart';
import PieChart from '../Components/Charts/PieChart';
import DateRangeFilter, { toDateInputValue } from '../Components/DateRangeFilter';

interface DateRangeProps {
  startDate?: string;
  endDate?: string;
}

interface LeadPerformanceRow {
  id: string;
  name: string;
  leadsAssigned: number;
  leadsContacted: number;
  leadsNotContacted: number;
  quotesSent: number;
  dueFollowUps: number;
  overdueFollowUps: number;
  convertedCount: number;
}

interface ConversionReportRow {
  id: string;
  name: string;
  leadCount: number;
  convertedCount: number;
  conversionRate: number;
}

interface RenewalReportRow {
  id: string;
  name: string;
  needsRenewalCount: number;
  contactedCount: number;
  renewedCount: number;
}

interface ProfitReportRow {
  id: string;
  name: string;
  mandatoryProfit: number;
  thirdPartyProfit: number;
  complimentaryProfit: number;
  totalProfit: number;
}

const TABS = [
  { key: 'performance', label: 'Agent Performance' },
  { key: 'conversion', label: 'Conversion Rate' },
  { key: 'renewal', label: 'Renewal' },
  { key: 'profit', label: 'Profit' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

/** Validated categorical palette (see dataviz skill's palette.md) — fixed order, never cycled. */
const CATEGORICAL = {
  blue: '#2a78d6',
  orange: '#eb6834',
  aqua: '#1baf7a',
  yellow: '#eda100',
  magenta: '#e87ba4',
  green: '#008300',
  violet: '#4a3aa7',
  red: '#e34948',
};

/** Reserved status palette — only for series that literally mean good/warning/neutral, never reused for plain identity. */
const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  neutral: '#898781',
};

function rateBadgeClass(rate: number) {
  return rate >= 50 ? 'bg-success-50 text-success-600' : rate > 0 ? 'bg-amber-50 text-amber-600' : 'bg-neutral-100 text-text-muted';
}

function AgentNameCell({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-md bg-primary-50 border border-primary-100 flex items-center justify-center text-[11px] font-bold text-primary-700 shrink-0">
        {name.charAt(0)}
      </div>
      <span className="text-text font-medium">{name}</span>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg bg-surface shadow-card p-5 animate-fade-in-up">
      <h3 className="text-sm font-semibold text-text mb-4">{title}</h3>
      {children}
    </div>
  );
}

function LeadPerformanceTable({ startDate, endDate }: DateRangeProps) {
  const [rows, setRows] = useState<LeadPerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE}/api/reports/lead-performance`, { params: { startDate, endDate } })
      .then((res) => setRows(res.data))
      .catch((err) => console.error('Failed to load lead performance report', err))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const headers = ['Agent Name', 'Leads Assigned', 'Leads Contacted', 'Leads Not Contacted', 'Quotes Sent', 'Follow-ups Due', 'Overdue Follow-ups', 'Converted'];

  return (
    <>
      <div className="border border-border rounded-lg overflow-x-auto bg-surface shadow-card animate-fade-in-up">
        <table className="w-full border-collapse table-auto">
          <thead className="sticky top-0 z-[2]">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={headers.length} className="text-center py-10 text-text-muted"><RefreshCw size={18} className="animate-spin inline-block" /></td></tr>
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-neutral-50">
                  <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap"><AgentNameCell name={row.name} /></td>
                  <td className="px-4 py-3 text-sm text-text font-medium border-b border-border whitespace-nowrap">{row.leadsAssigned}</td>
                  <td className="px-4 py-3 text-sm text-text font-medium border-b border-border whitespace-nowrap">{row.leadsContacted}</td>
                  <td className="px-4 py-3 text-sm text-text font-medium border-b border-border whitespace-nowrap">{row.leadsNotContacted}</td>
                  <td className="px-4 py-3 text-sm text-text font-medium border-b border-border whitespace-nowrap">{row.quotesSent}</td>
                  <td className="px-4 py-3 text-sm font-medium border-b border-border whitespace-nowrap">
                    <span className={row.dueFollowUps > 0 ? 'text-amber-600' : 'text-text-muted'}>{row.dueFollowUps}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium border-b border-border whitespace-nowrap">
                    <span className={row.overdueFollowUps > 0 ? 'text-danger-600' : 'text-text-muted'}>{row.overdueFollowUps}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-success-600 font-semibold border-b border-border whitespace-nowrap">{row.convertedCount}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={headers.length} className="text-center py-10 text-text-muted">No agents found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-text-muted mt-3">
        "Contacted" means the lead's status has moved past New. "Quotes Sent" counts a lead once it has ever reached the Quote Sent stage, even if it has since progressed further —
        like Converted, this only counts leads still open or converted after this report was introduced, since a lead's history is removed along with it on conversion.
        "Follow-ups Due" and "Overdue Follow-ups" reflect each agent's current customer reminder backlog and are not affected by the date filter below.
        "Converted" is credited to whichever agent actually converted the lead — reassigning the resulting customer to a different agent afterward doesn't move this credit.
      </p>
    </>
  );
}

type DatePreset = 'all' | 'day' | 'month' | 'year' | 'custom';

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'all', label: 'All Time' },
  { key: 'day', label: 'Today' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
  { key: 'custom', label: 'Custom Range' },
];

/** Computes the effective {startDate, endDate} for a preset, given custom from/to when applicable. */
function computeDateRange(preset: DatePreset, customFrom: string, customTo: string): DateRangeProps {
  const now = new Date();
  switch (preset) {
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

function ConversionRateTable({ startDate, endDate }: DateRangeProps) {
  const [rows, setRows] = useState<ConversionReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE}/api/reports/agents`, { params: { startDate, endDate } })
      .then((res) => setRows(res.data))
      .catch((err) => console.error('Failed to load conversion report', err))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const agentColorOrder = [CATEGORICAL.blue, CATEGORICAL.orange, CATEGORICAL.aqua, CATEGORICAL.yellow, CATEGORICAL.magenta, CATEGORICAL.green, CATEGORICAL.violet, CATEGORICAL.red];
  const totalConverted = rows.reduce((sum, r) => sum + r.convertedCount, 0);

  return (
    <>
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-2 gap-5 mb-6 max-lg:grid-cols-1">
          <ChartCard title="Assigned Leads vs. Converted, per Agent">
            <BarChart
              categories={rows.map((r) => r.name)}
              series={[
                { key: 'leadCount', label: 'Assigned Leads', color: CATEGORICAL.blue },
                { key: 'convertedCount', label: 'Converted', color: CATEGORICAL.orange },
              ]}
              data={rows}
            />
          </ChartCard>
          <ChartCard title="Share of Conversions by Agent">
            <PieChart
              data={rows.map((r, i) => ({ key: r.id, label: r.name, value: r.convertedCount, color: agentColorOrder[i % agentColorOrder.length] }))}
              centerLabel="Total Converted"
              centerValue={totalConverted}
            />
          </ChartCard>
        </div>
      )}

      <div className="border border-border rounded-lg overflow-x-auto bg-surface shadow-card animate-fade-in-up">
        <table className="w-full border-collapse table-auto">
          <thead className="sticky top-0 z-[2]">
            <tr>
              {['Agent Name', 'Total Assigned Leads', 'Customers Converted', 'Conversion Rate'].map((h) => (
                <th key={h} className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-10 text-text-muted"><RefreshCw size={18} className="animate-spin inline-block" /></td></tr>
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-neutral-50">
                  <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap"><AgentNameCell name={row.name} /></td>
                  <td className="px-4 py-3 text-sm text-text font-medium border-b border-border whitespace-nowrap">{row.leadCount}</td>
                  <td className="px-4 py-3 text-sm text-text font-medium border-b border-border whitespace-nowrap">{row.convertedCount}</td>
                  <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${rateBadgeClass(row.conversionRate)}`}>
                      {row.conversionRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="text-center py-10 text-text-muted">No agents found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-text-muted mt-3">
        "Leads" counts each agent's currently open leads. "Converted to Customers" only counts conversions made after this report was introduced — leads are removed once converted, so earlier conversions aren't retroactively counted.
        This credit stays with whichever agent actually converted the lead, even if the resulting customer is later reassigned to a different agent.
      </p>
    </>
  );
}

function RenewalTable({ startDate, endDate }: DateRangeProps) {
  const [rows, setRows] = useState<RenewalReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE}/api/reports/renewals`, { params: { startDate, endDate } })
      .then((res) => setRows(res.data))
      .catch((err) => console.error('Failed to load renewal report', err))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  // Aggregate pipeline stage totals across all agents, as mutually-exclusive buckets.
  const totalNeedsRenewal = rows.reduce((sum, r) => sum + r.needsRenewalCount, 0);
  const totalContacted = rows.reduce((sum, r) => sum + r.contactedCount, 0);
  const totalRenewed = rows.reduce((sum, r) => sum + r.renewedCount, 0);
  const notContacted = Math.max(0, totalNeedsRenewal - totalContacted);
  const inProgress = Math.max(0, totalContacted - totalRenewed);

  return (
    <>
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-2 gap-5 mb-6 max-lg:grid-cols-1">
          <ChartCard title="Renewal Pipeline, per Agent">
            <BarChart
              categories={rows.map((r) => r.name)}
              series={[
                { key: 'needsRenewalCount', label: 'Needs Renewal', color: CATEGORICAL.blue },
                { key: 'contactedCount', label: 'Contacted', color: CATEGORICAL.orange },
                { key: 'renewedCount', label: 'Renewed', color: CATEGORICAL.aqua },
              ]}
              data={rows}
            />
          </ChartCard>
          <ChartCard title="Renewal Pipeline Breakdown (all agents)">
            <PieChart
              data={[
                { key: 'not_contacted', label: 'Not Contacted', value: notContacted, color: STATUS.neutral },
                { key: 'in_progress', label: 'Contacted (in progress)', value: inProgress, color: STATUS.warning },
                { key: 'renewed', label: 'Renewed & Closed', value: totalRenewed, color: STATUS.good },
              ]}
              centerLabel="Needs Renewal"
              centerValue={totalNeedsRenewal}
            />
          </ChartCard>
        </div>
      )}

      <div className="border border-border rounded-lg overflow-x-auto bg-surface shadow-card animate-fade-in-up">
        <table className="w-full border-collapse table-auto">
          <thead className="sticky top-0 z-[2]">
            <tr>
              {['Agent Name', 'Customers Needing Renewal', 'Customers Contacted', 'Renewed & Closed'].map((h) => (
                <th key={h} className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-10 text-text-muted"><RefreshCw size={18} className="animate-spin inline-block" /></td></tr>
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-neutral-50">
                  <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap"><AgentNameCell name={row.name} /></td>
                  <td className="px-4 py-3 text-sm text-text font-medium border-b border-border whitespace-nowrap">{row.needsRenewalCount}</td>
                  <td className="px-4 py-3 text-sm text-text font-medium border-b border-border whitespace-nowrap">{row.contactedCount}</td>
                  <td className="px-4 py-3 text-sm text-text font-medium border-b border-border whitespace-nowrap">{row.renewedCount}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="text-center py-10 text-text-muted">No agents found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-text-muted mt-3">
        {startDate || endDate
          ? 'A customer counts as "needing renewal" if any of their policies has an end date within the selected range.'
          : 'A customer counts as "needing renewal" if any of their policies expires within 30 days or has already expired.'}
        {' '}"Customers Contacted" and "Renewed &amp; Closed" are set per-policy from the Renewal Status field in the Policy edit form.
      </p>
    </>
  );
}

function formatCurrency(amount: number) {
  const sign = amount < 0 ? '-' : '';
  return `${sign}₪${Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function ProfitAmountCell({ amount }: { amount: number }) {
  return (
    <span className={amount < 0 ? 'text-danger-600' : amount > 0 ? 'text-success-600' : 'text-text-muted'}>
      {formatCurrency(amount)}
    </span>
  );
}

function ProfitTable({ startDate, endDate }: DateRangeProps) {
  const [rows, setRows] = useState<ProfitReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE}/api/reports/profit`, { params: { startDate, endDate } })
      .then((res) => setRows(res.data))
      .catch((err) => console.error('Failed to load profit report', err))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  return (
    <>
      <div className="border border-border rounded-lg overflow-x-auto bg-surface shadow-card animate-fade-in-up">
        <table className="w-full border-collapse table-auto">
          <thead className="sticky top-0 z-[2]">
            <tr>
              {['Agent Name', 'Mandatory Profit', 'Third Party Profit', 'Complimentary Profit', 'Total Profit'].map((h) => (
                <th key={h} className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10 text-text-muted"><RefreshCw size={18} className="animate-spin inline-block" /></td></tr>
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-neutral-50">
                  <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap"><AgentNameCell name={row.name} /></td>
                  <td className="px-4 py-3 text-sm font-medium border-b border-border whitespace-nowrap"><ProfitAmountCell amount={row.mandatoryProfit} /></td>
                  <td className="px-4 py-3 text-sm font-medium border-b border-border whitespace-nowrap"><ProfitAmountCell amount={row.thirdPartyProfit} /></td>
                  <td className="px-4 py-3 text-sm font-medium border-b border-border whitespace-nowrap"><ProfitAmountCell amount={row.complimentaryProfit} /></td>
                  <td className="px-4 py-3 text-sm font-semibold border-b border-border whitespace-nowrap"><ProfitAmountCell amount={row.totalProfit} /></td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="text-center py-10 text-text-muted">No agents found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-text-muted mt-3">
        Profit is calculated as selling price minus cost price, per insurance category, summed across each agent's customers
        {(startDate || endDate) ? ' converted within the selected date range' : ''}.
        Each customer's cost price is locked in at the time they were converted from a lead, so editing Cost Price only affects future conversions — past profit figures never change.
        Profit is credited to whichever agent originally brought in the customer — reassigning them to a different agent afterward doesn't move this credit.
      </p>
    </>
  );
}

export default function AgentReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('performance');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const { startDate, endDate } = computeDateRange(datePreset, customFrom, customTo);

  return (
    <div className="font-sans bg-surface-muted text-text h-full flex flex-col">
      <div className="px-8 pt-6 pb-2 border-b border-border max-md:px-4 max-md:pt-4">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2.5 max-md:text-xl">
          <BarChart3 size={24} className="text-primary-600" /> Agent Reports
        </h1>
        <p className="text-sm text-text-muted mt-1 max-md:text-xs">Per-agent performance</p>
      </div>

      {/* Tabs */}
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

      <DateRangeFilter
        presets={DATE_PRESETS}
        activePreset={datePreset}
        onPresetChange={(preset) => setDatePreset(preset as DatePreset)}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      />

      <div className="flex-1 overflow-auto px-8 pb-8 max-md:px-4 max-md:pb-4 mt-4">
        {activeTab === 'performance' && <LeadPerformanceTable startDate={startDate} endDate={endDate} />}
        {activeTab === 'conversion' && <ConversionRateTable startDate={startDate} endDate={endDate} />}
        {activeTab === 'renewal' && <RenewalTable startDate={startDate} endDate={endDate} />}
        {activeTab === 'profit' && <ProfitTable startDate={startDate} endDate={endDate} />}
      </div>
    </div>
  );
}
