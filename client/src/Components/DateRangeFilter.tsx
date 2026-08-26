import { Calendar } from 'lucide-react';

export interface DatePresetOption {
  key: string;
  label: string;
}

/** Formats a Date as a local YYYY-MM-DD string (avoids UTC shift from toISOString). */
export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface DateRangeFilterProps {
  presets: DatePresetOption[];
  activePreset: string;
  onPresetChange: (preset: string) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  /** Preset key that reveals the custom from/to date inputs. Defaults to 'custom'. */
  customPresetKey?: string;
}

export default function DateRangeFilter({
  presets,
  activePreset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  customPresetKey = 'custom',
}: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap px-8 pt-4 max-md:px-4">
      <Calendar size={15} className="text-text-muted shrink-0" />
      {presets.map((p) => (
        <button
          key={p.key}
          onClick={() => onPresetChange(p.key)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all cursor-pointer ${
            activePreset === p.key
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-surface text-text-muted border-border hover:bg-neutral-50 hover:text-text'
          }`}
        >
          {p.label}
        </button>
      ))}
      {activePreset === customPresetKey && (
        <div className="flex items-center gap-2 ml-1">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomFromChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs text-text bg-surface border border-border rounded-lg outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
          <span className="text-xs text-text-muted">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => onCustomToChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs text-text bg-surface border border-border rounded-lg outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
      )}
    </div>
  );
}
