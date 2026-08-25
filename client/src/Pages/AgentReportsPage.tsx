import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, RefreshCw } from 'lucide-react';
import { API_BASE } from '../config';
import BarChart from '../Components/Charts/BarChart';
import PieChart from '../Components/Charts/PieChart';

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

const TABS = [
  { key: 'conversion', label: 'Conversion Rate' },
  { key: 'renewal', label: 'Renewal' },
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

function ConversionRateTable() {
  const [rows, setRows] = useState<ConversionReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/api/reports/agents`)
      .then((res) => setRows(res.data))
      .catch((err) => console.error('Failed to load conversion report', err))
      .finally(() => setLoading(false));
  }, []);

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
      </p>
    </>
  );
}

function RenewalTable() {
  const [rows, setRows] = useState<RenewalReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/api/reports/renewals`)
      .then((res) => setRows(res.data))
      .catch((err) => console.error('Failed to load renewal report', err))
      .finally(() => setLoading(false));
  }, []);

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
        A customer counts as "needing renewal" if any of their policies expires within 30 days or has already expired.
        "Customers Contacted" and "Renewed &amp; Closed" are set per-policy from the Renewal Status field in the Policy edit form.
      </p>
    </>
  );
}

export default function AgentReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('conversion');

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

      <div className="flex-1 overflow-auto px-8 pb-8 max-md:px-4 max-md:pb-4 mt-4">
        {activeTab === 'conversion' && <ConversionRateTable />}
        {activeTab === 'renewal' && <RenewalTable />}
      </div>
    </div>
  );
}
