import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Save, RefreshCw, CheckCircle2 } from 'lucide-react';
import { API_BASE } from '../config';

interface CostPriceRow {
  category: 'MANDATORY' | 'THIRD_PARTY' | 'COMPLIMENTARY';
  costPrice: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  MANDATORY: 'Mandatory',
  THIRD_PARTY: 'Third Party',
  COMPLIMENTARY: 'Complimentary',
};

const CATEGORY_ORDER = ['MANDATORY', 'THIRD_PARTY', 'COMPLIMENTARY'];

export default function CostPricePage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingCategory, setSavingCategory] = useState<string | null>(null);
  const [savedCategory, setSavedCategory] = useState<string | null>(null);

  useEffect(() => {
    axios.get(`${API_BASE}/api/cost-prices`)
      .then((res: { data: CostPriceRow[] }) => {
        const next: Record<string, string> = {};
        for (const row of res.data) next[row.category] = String(row.costPrice);
        setValues(next);
      })
      .catch((err) => console.error('Failed to load cost prices', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (category: string) => {
    const costPrice = Number(values[category]);
    if (Number.isNaN(costPrice) || costPrice < 0) return;

    setSavingCategory(category);
    setSavedCategory(null);
    try {
      await axios.put(`${API_BASE}/api/cost-prices/${category}`, { costPrice });
      setSavedCategory(category);
      setTimeout(() => setSavedCategory((c) => (c === category ? null : c)), 2000);
    } catch (error) {
      console.error('Failed to save cost price', error);
    } finally {
      setSavingCategory(null);
    }
  };

  return (
    <div className="font-sans bg-surface-muted text-text h-full flex flex-col">
      <div className="px-8 pt-6 pb-2 border-b border-border max-md:px-4 max-md:pt-4">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2.5 max-md:text-xl">
          <DollarSign size={24} className="text-primary-600" /> Cost Price
        </h1>
        <p className="text-sm text-text-muted mt-1 mb-4 max-md:text-xs">
          The cost price per insurance category, used to calculate agent profit in Reports → Profit.
          Changes only apply to customers converted from a lead after the change — past profit figures are locked in and won't shift.
        </p>
      </div>

      <div className="flex-1 overflow-auto px-8 pb-8 max-md:px-4 max-md:pb-4 mt-4">
        {loading ? (
          <div className="flex justify-center py-10 text-text-muted"><RefreshCw size={20} className="animate-spin" /></div>
        ) : (
          <div className="max-w-lg flex flex-col gap-4">
            {CATEGORY_ORDER.map((category) => (
              <div key={category} className="border border-border rounded-lg bg-surface shadow-card p-5 flex items-end gap-3">
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <label className="text-xs font-medium text-text-muted">{CATEGORY_LABELS[category]} Cost Price (₪)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3.5 py-2.5 text-sm text-text bg-surface border border-border rounded-lg outline-none transition-all placeholder:text-neutral-400 hover:border-neutral-300 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    placeholder="e.g. 400"
                    value={values[category] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, [category]: e.target.value }))}
                  />
                </div>
                <button
                  type="button"
                  disabled={savingCategory === category}
                  onClick={() => handleSave(category)}
                  className="px-4 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all bg-primary-600 text-white border-none hover:bg-primary-700 disabled:opacity-50 disabled:cursor-wait inline-flex items-center gap-2 shrink-0"
                >
                  {savingCategory === category ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : savedCategory === category ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  {savedCategory === category ? 'Saved' : 'Save'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
