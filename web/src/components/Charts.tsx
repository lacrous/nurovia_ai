/**
 * Lightweight SVG charts — no external library, fully themed via CSS vars.
 * Designed for the admin dashboard. Native dpr-aware via viewBox.
 */

import { useMemo } from "react";

interface LineChartProps {
  data: Array<{ date: string; value: number }>;
  height?: number;
  color?: string;
  showGrid?: boolean;
  formatY?: (v: number) => string;
}

/**
 * Smooth line chart with gradient fill underneath. Pure SVG, no deps.
 */
export function LineChart({
  data,
  height = 180,
  color = "hsl(var(--ring))",
  showGrid = true,
  formatY = (v) => Intl.NumberFormat("en", { notation: "compact" }).format(v),
}: LineChartProps) {
  const { path, areaPath, points, maxY } = useMemo(() => {
    if (data.length === 0) {
      return { path: "", areaPath: "", points: [], maxY: 0 };
    }
    const values = data.map((d) => d.value);
    const maxY = Math.max(...values);
    const minY = Math.min(...values);
    const padding = (maxY - minY) * 0.1;
    const ymin = minY - padding;
    const ymax = maxY + padding;
    const width = 600;
    const step = width / Math.max(data.length - 1, 1);
    const xy = data.map((d, i) => {
      const x = i * step;
      const yNorm = (d.value - ymin) / Math.max(ymax - ymin, 1);
      const y = height - 24 - yNorm * (height - 40);
      return { x, y, value: d.value };
    });
    const path = xy
      .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
      .join(" ");
    const areaPath = `${path} L ${xy[xy.length - 1]!.x} ${height - 24} L 0 ${height - 24} Z`;
    return { path, areaPath, points: xy, maxY, minY: ymin };
  }, [data, height]);

  const gradId = `line-grad-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg
      viewBox={`0 0 600 ${height}`}
      preserveAspectRatio="none"
      className="w-full h-auto"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showGrid && (
        <g className="txt-faint" opacity="0.3">
          {[0, 0.25, 0.5, 0.75, 1].map((p) => {
            const y = 16 + (height - 40) * p;
            return <line key={p} x1="0" y1={y} x2="600" y2={y} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" />;
          })}
        </g>
      )}
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.length > 0 && points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} />
      ))}
      <text
        x="0"
        y="14"
        fill="currentColor"
        className="txt-faint"
        fontSize="10"
      >
        {formatY(maxY)}
      </text>
    </svg>
  );
}

/**
 * Bar chart with optional grouping (per-series).
 */
interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  height?: number;
  color?: string;
  highlightTop?: number;
}

export function BarChart({
  data,
  height = 160,
  color = "hsl(var(--ring))",
  highlightTop = 0,
}: BarChartProps) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const width = 600;
  const barWidth = (width / data.length) * 0.7;
  const gap = ((width / data.length) - barWidth) / 2;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 30);
        const x = i * (width / data.length) + gap;
        const y = height - 20 - h;
        const isTop = i === highlightTop;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={h}
              rx="3"
              fill={isTop ? "hsl(var(--gold))" : color}
              opacity={isTop ? 1 : 0.85}
            />
            <text
              x={x + barWidth / 2}
              y={height - 6}
              fill="currentColor"
              className="txt-faint"
              fontSize="9"
              textAnchor="middle"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

interface DonutProps {
  data: Array<{ name: string; value: number; color: string }>;
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

/**
 * Donut chart for distributions.
 */
export function Donut({ data, size = 180, thickness = 22, centerLabel, centerValue }: DonutProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  if (total === 0) return null;
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto" style={{ maxWidth: size }}>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="hsl(var(--surface))" strokeWidth={thickness} />
      {data.map((d, i) => {
        const length = (d.value / total) * circumference;
        const arc = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={d.color}
            strokeWidth={thickness}
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        );
        offset += length;
        return arc;
      })}
      {centerLabel && (
        <text x={cx} y={cy - 4} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10">
          {centerLabel}
        </text>
      )}
      {centerValue && (
        <text x={cx} y={cy + 14} textAnchor="middle" fill="hsl(var(--foreground))" fontSize="14" fontWeight="600">
          {centerValue}
        </text>
      )}
    </svg>
  );
}

/**
 * Sparkline — minimal inline trend for KPI cards.
 */
interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}
export function Sparkline({ data, color = "hsl(var(--ring))", width = 100, height = 28 }: SparklineProps) {
  if (data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / Math.max(data.length - 1, 1);
  const path = data
    .map((v, i) => {
      const x = i * step;
      const y = height - 2 - ((v - min) / range) * (height - 4);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Horizontal bar — single bar with label.
 */
interface MetricBarProps {
  label: string;
  value: number;
  total: number;
  color?: string;
}
export function MetricBar({ label, value, total, color = "hsl(var(--ring))" }: MetricBarProps) {
  const pct = (value / Math.max(total, 1)) * 100;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11.5px]">
        <span className="txt-body">{label}</span>
        <span className="txt-muted font-mono tabular-nums">{value.toLocaleString()} · {pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}