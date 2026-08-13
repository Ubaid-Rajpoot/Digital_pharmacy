// ============================================================
// MEDORA CONTROL CENTRE — dependency-free SVG charts
// ============================================================

import type { CSSProperties } from "react";
import { compactMoney } from "./format";

const VB = { w: 600, h: 220, pl: 46, pr: 12, pt: 14, pb: 30 };

export interface ChartPoint {
  label: string;
  value: number;
  secondary?: number;
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  const norm = v / mag;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return nice * mag;
}

export function LineChart({
  points,
  height = VB.h,
  color = "var(--admin-blue)",
  secondaryColor = "var(--admin-green)",
  showSecondary = false,
  formatValue = compactMoney,
}: {
  points: ChartPoint[];
  height?: number;
  color?: string;
  secondaryColor?: string;
  showSecondary?: boolean;
  formatValue?: (n: number) => string;
}) {
  const w = VB.w;
  const pl = VB.pl, pr = VB.pr, pt = VB.pt, pb = VB.pb;
  const iw = w - pl - pr, ih = height - pt - pb;
  const max = niceMax(Math.max(...points.map((p) => p.value), ...(showSecondary ? points.map((p) => p.secondary ?? 0) : [0])));
  const x = (i: number) => pl + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v: number) => pt + ih - (v / max) * ih;

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${pt + ih} L${x(0).toFixed(1)},${pt + ih} Z`;
  const secLine = showSecondary
    ? points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.secondary ?? 0).toFixed(1)}`).join(" ")
    : "";

  const yTicks = 4;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} role="img">
      <defs>
        <linearGradient id="ln-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const v = (max / yTicks) * (yTicks - i);
        const yy = pt + (ih / yTicks) * i;
        return (
          <g key={i}>
            <line x1={pl} x2={w - pr} y1={yy} y2={yy} className="admin-chart-grid" />
            <text x={pl - 7} y={yy + 3} textAnchor="end" fontSize="9" fill="currentColor" opacity="0.75">
              {formatValue(Math.round(v))}
            </text>
          </g>
        );
      })}
      <path d={area} fill="url(#ln-fill)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {showSecondary && (
        <path d={secLine} fill="none" stroke={secondaryColor} strokeWidth="1.8" strokeDasharray="5 5" strokeLinecap="round" />
      )}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.value)} r="3.2" fill="#fff" stroke={color} strokeWidth="2">
            <title>{`${p.label}: ${formatValue(p.value)}${showSecondary ? ` · target ${formatValue(p.secondary ?? 0)}` : ""}`}</title>
          </circle>
          <text x={x(i)} y={height - 8} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.75">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function BarChart({
  points,
  height = VB.h,
  color = "var(--admin-blue)",
  formatValue = compactMoney,
}: {
  points: ChartPoint[];
  height?: number;
  color?: string;
  formatValue?: (n: number) => string;
}) {
  const w = VB.w;
  const pl = VB.pl, pr = VB.pr, pt = VB.pt, pb = VB.pb;
  const iw = w - pl - pr, ih = height - pt - pb;
  const max = niceMax(Math.max(...points.map((p) => p.value)));
  const slot = iw / points.length;
  const barW = Math.min(34, slot * 0.52);
  const yTicks = 4;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} role="img">
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const v = (max / yTicks) * (yTicks - i);
        const yy = pt + (ih / yTicks) * i;
        return (
          <g key={i}>
            <line x1={pl} x2={w - pr} y1={yy} y2={yy} className="admin-chart-grid" />
            <text x={pl - 7} y={yy + 3} textAnchor="end" fontSize="9" fill="currentColor" opacity="0.75">
              {formatValue(Math.round(v))}
            </text>
          </g>
        );
      })}
      {points.map((p, i) => {
        const h = (p.value / max) * ih;
        const cx = pl + slot * i + slot / 2;
        const idx = points.length - i; // newest on the right
        const c = p.secondary !== undefined && p.secondary > 0 ? "var(--admin-green)" : color;
        return (
          <g key={i}>
            <rect
              x={cx - barW / 2}
              y={pt + ih - h}
              width={barW}
              height={Math.max(h, p.value > 0 ? 2 : 0)}
              rx="4"
              fill={c}
              opacity={0.78 + 0.22 * (idx / points.length)}
            >
              <title>{`${p.label}: ${formatValue(p.value)}`}</title>
            </rect>
            <text x={cx} y={height - 8} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.75">
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function DonutChart({
  data,
  size = 150,
  thickness = 17,
  centerLabel,
  centerValue,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  // precompute cumulative offsets so render stays pure
  const segments = data.map((d, i) => {
    const cumulative = data.slice(0, i).reduce((s, x) => s + x.value, 0);
    return { d, offset: -(cumulative / total) * circ, frac: d.value / total };
  });
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef3f8" strokeWidth={thickness} />
        {segments.map(({ d, offset, frac }, i) => {
          const dash = frac * circ;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            >
              <title>{`${d.label}: ${d.value}`}</title>
            </circle>
          );
        })}
      </svg>
      {(centerLabel || centerValue) && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeContent: "center", textAlign: "center" }}>
          {centerValue && <strong style={{ fontFamily: "var(--ff-d)", fontSize: 19, lineHeight: 1 }}>{centerValue}</strong>}
          {centerLabel && <small style={{ color: "var(--admin-muted)", fontSize: 9, fontWeight: 800, marginTop: 4 }}>{centerLabel}</small>}
        </div>
      )}
    </div>
  );
}

export function MiniBars({ values, color = "var(--admin-blue)" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return (      <div className="admin-mini-bars" style={color ? ({ "--bar": color } as CSSProperties) : undefined}>
      {values.map((v, i) => (
        <i key={i} style={{ height: `${Math.max(12, (v / max) * 100)}%`, background: "var(--bar, var(--admin-blue))" }} />
      ))}
    </div>
  );
}

export function Sparkline({ values, color = "var(--admin-green)", w = 84, h = 26 }: { values: number[]; color?: string; w?: number; h?: number }) {
  if (values.length < 2) return <svg width={w} height={h} />;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / span) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
