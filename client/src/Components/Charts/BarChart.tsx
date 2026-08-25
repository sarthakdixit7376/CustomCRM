import { useState } from 'react';

export interface BarSeries {
  key: string;
  label: string;
  color: string;
}

interface BarChartProps {
  /** One label per category (e.g. agent names) — the x-axis. */
  categories: string[];
  series: BarSeries[];
  /** One entry per category, keyed by series.key (extra non-numeric fields, e.g. an id/name, are fine). */
  data: any[];
  height?: number;
}

/** Rounds a max value up to a "clean" gridline top (1 / 2 / 5 × a power of ten). */
function niceMax(value: number): number {
  if (value <= 0) return 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export default function BarChart({ categories, series, data, height = 260 }: BarChartProps) {
  const [hovered, setHovered] = useState<{ catIndex: number; seriesKey: string } | null>(null);

  const width = 720;
  const marginLeft = 36;
  const marginRight = 16;
  const marginTop = 16;
  const marginBottom = 32;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  const rawMax = Math.max(1, ...data.flatMap((row) => series.map((s) => Number(row[s.key]) || 0)));
  const maxValue = niceMax(rawMax);
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => Math.round((maxValue / tickCount) * i));

  const yScale = (v: number) => plotHeight - (v / maxValue) * plotHeight;

  const bandWidth = plotWidth / Math.max(1, categories.length);
  const barGap = 4;
  const maxBarThickness = 24;
  const groupPadding = bandWidth * 0.16;
  const availableForBars = bandWidth - groupPadding * 2 - barGap * (series.length - 1);
  const barWidth = Math.max(4, Math.min(maxBarThickness, availableForBars / series.length));
  const groupWidth = barWidth * series.length + barGap * (series.length - 1);

  const hasData = data.length > 0 && series.length > 0;

  return (
    <div className="relative">
      {/* Legend */}
      {series.length > 1 && (
        <div className="flex items-center gap-4 mb-3 flex-wrap">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5 text-xs text-text">
              <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      )}

      {!hasData ? (
        <div className="flex items-center justify-center text-sm text-text-muted" style={{ height }}>No data yet</div>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} role="img" aria-label="Bar chart">
          <g transform={`translate(${marginLeft},${marginTop})`}>
            {/* Gridlines + y-axis ticks */}
            {ticks.map((t) => (
              <g key={t}>
                <line x1={0} x2={plotWidth} y1={yScale(t)} y2={yScale(t)} stroke="var(--color-border)" strokeWidth={1} />
                <text x={-8} y={yScale(t)} textAnchor="end" dominantBaseline="middle" className="fill-text-muted" style={{ fontSize: 10 }}>
                  {t.toLocaleString()}
                </text>
              </g>
            ))}

            {/* Bars */}
            {categories.map((cat, catIndex) => {
              const groupX = catIndex * bandWidth + (bandWidth - groupWidth) / 2;
              return (
                <g key={cat}>
                  {series.map((s, sIndex) => {
                    const value = Number(data[catIndex]?.[s.key]) || 0;
                    const barHeight = Math.max(0, plotHeight - yScale(value));
                    const x = groupX + sIndex * (barWidth + barGap);
                    const isHovered = hovered?.catIndex === catIndex && hovered?.seriesKey === s.key;
                    return (
                      <g key={s.key}>
                        <rect
                          x={x}
                          y={yScale(value)}
                          width={barWidth}
                          height={barHeight}
                          rx={4}
                          fill={s.color}
                          opacity={isHovered ? 0.85 : 1}
                          style={{ cursor: 'pointer', transition: 'opacity 0.1s' }}
                          onMouseEnter={() => setHovered({ catIndex, seriesKey: s.key })}
                          onMouseLeave={() => setHovered(null)}
                          onFocus={() => setHovered({ catIndex, seriesKey: s.key })}
                          onBlur={() => setHovered(null)}
                          tabIndex={0}
                        />
                        {isHovered && (
                          <g>
                            <rect
                              x={x + barWidth / 2 - 46}
                              y={Math.max(0, yScale(value) - 34)}
                              width={92}
                              height={26}
                              rx={5}
                              fill="var(--color-text)"
                            />
                            <text
                              x={x + barWidth / 2}
                              y={Math.max(0, yScale(value) - 34) + 17}
                              textAnchor="middle"
                              style={{ fontSize: 11, fontWeight: 600 }}
                              fill="var(--color-surface)"
                            >
                              {s.label}: {value.toLocaleString()}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                  {/* Category label */}
                  <text
                    x={catIndex * bandWidth + bandWidth / 2}
                    y={plotHeight + 18}
                    textAnchor="middle"
                    className="fill-text-muted"
                    style={{ fontSize: 10 }}
                  >
                    {cat.length > 10 ? `${cat.slice(0, 9)}…` : cat}
                  </text>
                </g>
              );
            })}

            {/* Baseline */}
            <line x1={0} x2={plotWidth} y1={plotHeight} y2={plotHeight} stroke="var(--color-border)" strokeWidth={1} />
          </g>
        </svg>
      )}
    </div>
  );
}
