import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, RefreshCw } from 'lucide-react';
import { API_BASE } from '../config';

interface AgentReportRow {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'AGENT';
  customerCount: number;
  leadCount: number;
  convertedCount: number;
  conversionRate: number;
}

export default function AgentReportsPage() {
  const [rows, setRows] = useState<AgentReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/api/reports/agents`)
      .then((res) => setRows(res.data))
      .catch((err) => console.error('Failed to load agent report', err))
      .finally(() => setLoading(false));
  }, []);

  const rateBadgeClass = (rate: number) =>
    rate >= 50 ? 'bg-success-50 text-success-600' : rate > 0 ? 'bg-amber-50 text-amber-600' : 'bg-neutral-100 text-text-muted';

  return (
    <div className="font-sans bg-surface-muted text-text h-full flex flex-col">
      <div className="px-8 pt-6 pb-2 border-b border-border max-md:px-4 max-md:pt-4">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2.5 max-md:text-xl">
          <BarChart3 size={24} className="text-primary-600" /> Agent Reports
        </h1>
        <p className="text-sm text-text-muted mt-1 mb-4 max-md:text-xs">Customers, leads, and lead-to-customer conversion rate per agent</p>
      </div>

      <div className="flex-1 overflow-auto px-8 pb-8 max-md:px-4 max-md:pb-4 mt-4">
        <div className="border border-border rounded-lg overflow-x-auto bg-surface shadow-card animate-fade-in-up">
          <table className="w-full border-collapse table-auto">
            <thead className="sticky top-0 z-[2]">
              <tr>
                {['Agent Name', 'Role', 'Customers', 'Leads', 'Converted to Customers', 'Conversion Rate'].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-left bg-neutral-50 border-b border-border whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-text-muted"><RefreshCw size={18} className="animate-spin inline-block" /></td></tr>
              ) : rows.length > 0 ? (
                rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-neutral-50">
                    <td className="px-4 py-3 text-sm border-b border-border whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-primary-50 border border-primary-100 flex items-center justify-center text-[11px] font-bold text-primary-700 shrink-0">
                          {row.name.charAt(0)}
                        </div>
                        <span className="text-text font-medium">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted border-b border-border whitespace-nowrap">{row.role === 'ADMIN' ? 'Administrator' : 'Agent'}</td>
                    <td className="px-4 py-3 text-sm text-text font-medium border-b border-border whitespace-nowrap">{row.customerCount}</td>
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
                <tr><td colSpan={6} className="text-center py-10 text-text-muted">No agents found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-muted mt-3">
          "Leads" counts each agent's currently open leads. "Converted to Customers" only counts conversions made after this report was introduced — leads are removed once converted, so earlier conversions aren't retroactively counted.
        </p>
      </div>
    </div>
  );
}
