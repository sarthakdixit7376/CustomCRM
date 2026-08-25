import { useState } from 'react';

export interface PieSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieSlice[];
  size?: number;
  /** Label shown in the donut's center (e.g. the grand total). */
  centerLabel?: string;
  centerValue?: string | number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSlicePath(cx: number, cy: number, rOuter: number, rInner: number, startAngle: number, endAngle: number) {
  const startOuter = polarToCartesian(cx, cy, rOuter, endAngle);
  const endOuter = polarToCartesian(cx, cy, rOuter, startAngle);
  const startInner = polarToCartesian(cx, cy, rInner, startAngle);
  const endInner = polarToCartesian(cx, cy, rInner, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return [
    'M', startOuter.x, startOuter.y,
    'A', rOuter, rOuter, 0, largeArc, 0, endOuter.x, endOuter.y,
    'L', startInner.x, startInner.y,
    'A', rInner, rInner, 0, largeArc, 1, endInner.x, endInner.y,
    'Z',
  ].join(' ');
}

export default function PieChart({ data, size = 220, centerLabel, centerValue }: PieChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total <= 0) {
    return (
      <div className="flex items-center justify-center text-sm text-text-muted" style={{ height: size }}>
        No data yet
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 4;
  const rInner = rOuter * 0.6;

  let cursor = 0;
  const slices = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const startAngle = (cursor / total) * 360;
      cursor += d.value;
      const endAngle = (cursor / total) * 360;
      return { ...d, startAngle, endAngle, pct: (d.value / total) * 100 };
    });

  const hoveredSlice = slices.find((s) => s.key === hovered);

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Pie chart">
          {slices.map((s) => (
            <path
              key={s.key}
              d={donutSlicePath(cx, cy, hovered === s.key ? rOuter + 3 : rOuter, rInner, s.startAngle, s.endAngle)}
              fill={s.color}
              style={{ stroke: 'var(--color-surface)', strokeWidth: 3, cursor: 'pointer', transition: 'all 0.12s' }}
              onMouseEnter={() => setHovered(s.key)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(s.key)}
              onBlur={() => setHovered(null)}
              tabIndex={0}
            />
          ))}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hoveredSlice ? (
            <>
              <span className="text-lg font-semibold text-text">{hoveredSlice.value.toLocaleString()}</span>
              <span className="text-[11px] text-text-muted text-center px-4 leading-tight">{hoveredSlice.label}</span>
              <span className="text-[11px] text-text-muted">{hoveredSlice.pct.toFixed(0)}%</span>
            </>
          ) : (
            <>
              {centerValue !== undefined && <span className="text-lg font-semibold text-text">{centerValue}</span>}
              {centerLabel && <span className="text-[11px] text-text-muted text-center px-4 leading-tight">{centerLabel}</span>}
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-1.5 min-w-0">
        {slices.map((s) => (
          <div
            key={s.key}
            className="flex items-center gap-2 text-xs cursor-pointer"
            onMouseEnter={() => setHovered(s.key)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-text truncate">{s.label}</span>
            <span className="text-text-muted shrink-0">{s.value.toLocaleString()} ({s.pct.toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
