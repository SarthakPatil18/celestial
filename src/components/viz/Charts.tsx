import { useMemo } from "react";
import type { Site } from "../../data/sites";
import {
  buildModel,
  cachedAnalysis,
  earthPath,
  elevationDomain,
  hoursToLabel,
  sunPath,
  type Interval,
  type Sample,
} from "../../lib/mission";

const W = 840;
const H = 300;
const PAD = { top: 20, right: 22, bottom: 32, left: 44 };

function scaleX(hour: number) {
  return PAD.left + (hour / 24) * (W - PAD.left - PAD.right);
}
function scaleY(value: number, min: number, max: number) {
  return PAD.top + ((max - value) / (max - min)) * (H - PAD.top - PAD.bottom);
}

function useScrub(onScrub?: (hour: number) => void) {
  return (event: React.PointerEvent<SVGSVGElement>) => {
    if (!onScrub) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    const ratio = (x - PAD.left) / (W - PAD.left - PAD.right);
    onScrub(Math.min(23.99, Math.max(0, ratio * 24)));
  };
}

const HOUR_TICKS = [0, 4, 8, 12, 16, 20, 24];

function Grid({ min, max }: { min: number; max: number }) {
  const ticks = 4;
  const values = Array.from({ length: ticks + 1 }, (_, i) => min + ((max - min) * i) / ticks);
  return (
    <g>
      {values.map((value) => {
        const y = scaleY(value, min, max);
        return (
          <g key={value}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y}
              y2={y}
              className={Math.abs(value) < 0.001 ? "chart-zero" : "chart-grid"}
            />
            <text x={PAD.left - 9} y={y + 3} textAnchor="end" className="chart-tick">
              {Math.round(value)}°
            </text>
          </g>
        );
      })}
      {HOUR_TICKS.map((hour) => (
        <g key={hour}>
          <line
            x1={scaleX(hour)}
            x2={scaleX(hour)}
            y1={PAD.top}
            y2={H - PAD.bottom}
            className="chart-grid chart-grid--v"
          />
          <text
            x={scaleX(hour)}
            y={H - PAD.bottom + 16}
            textAnchor="middle"
            className="chart-tick"
          >
            {String(hour).padStart(2, "0")}
          </text>
        </g>
      ))}
      <text
        x={W - PAD.right}
        y={H - PAD.bottom + 27}
        textAnchor="end"
        className="chart-tick chart-tick--dim"
      >
        LOCAL SOL
      </text>
    </g>
  );
}

export interface ChartSeries {
  site: Site;
  tone: "sun" | "earth" | "field";
  label: string;
  dashed?: boolean;
}

export function PolarSolarProfile({
  series,
  localTime,
  onScrub,
  height: _height = 300,
  showField = true,
  compact = false,
}: {
  series: ChartSeries[];
  localTime: number;
  onScrub?: (hour: number) => void;
  height?: number;
  showField?: boolean;
  compact?: boolean;
}) {
  const paths = useMemo(
    () =>
      series.map((entry) => {
        const model = buildModel(entry.site);
        return { ...entry, model, samples: sunPath(model, 5) };
      }),
    [series],
  );

  const domain = useMemo(() => {
    const vals = paths.flatMap((p) => p.samples.map((s) => s.elev));
    return elevationDomain(vals);
  }, [paths]);

  const primary = paths[0];
  const primarySample = primary.samples[Math.min(primary.samples.length - 1, Math.round(localTime * 12))];
  const handle = useScrub(onScrub);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`chart chart--solar ${compact ? "chart--compact" : ""}`}
      role="img"
      aria-label={`24 hour solar elevation profile for ${primary.site.name}. Selected time ${hoursToLabel(localTime)} local solar time.`}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        handle(event);
      }}
      onPointerMove={(event) => {
        if (event.buttons === 1) handle(event);
      }}
    >
      <defs>
        <linearGradient id="solar-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-sun)" stopOpacity="0.22" />
          <stop offset="60%" stopColor="var(--chart-sun)" stopOpacity="0.06" />
          <stop offset="100%" stopColor="var(--chart-sun)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <Grid min={domain.min} max={domain.max} />

      {primary && (
        <path
          d={`${linePath(primary.samples, domain)} L ${scaleX(24)} ${scaleY(domain.min, domain.min, domain.max)} L ${scaleX(0)} ${scaleY(domain.min, domain.min, domain.max)} Z`}
          fill="url(#solar-fill)"
        />
      )}

      {primary &&
        (() => {
          const analysis = cachedAnalysis(primary.site);
          return analysis.sunTerrain.map((interval) => (
            <rect
              key={`${interval.start}-${interval.end}`}
              x={scaleX(interval.start)}
              y={scaleY(primary.site.sun.terrainHorizon, domain.min, domain.max)}
              width={Math.max(1.5, scaleX(interval.end) - scaleX(interval.start))}
              height={Math.max(2, PAD.top + (H - PAD.top - PAD.bottom))}
              className="chart-highlight"
            />
          ));
        })()}

      {paths.map((entry) => (
        <path
          key={entry.site.id}
          d={linePath(entry.samples, domain)}
          className={`chart-line chart-line--${entry.tone}${entry.dashed ? " chart-line--dashed" : ""}`}
        />
      ))}

      {primary && showField && (
        <line
          x1={scaleX(0)}
          x2={scaleX(24)}
          y1={scaleY(primary.site.sun.terrainHorizon, domain.min, domain.max)}
          y2={scaleY(primary.site.sun.terrainHorizon, domain.min, domain.max)}
          className="chart-threshold"
        />
      )}

      <g className="chart-marker">
        <line
          x1={scaleX(localTime)}
          x2={scaleX(localTime)}
          y1={PAD.top}
          y2={H - PAD.bottom}
          className="chart-marker__line"
        />
        {paths.map((entry) => {
          const h = localTime;
          const value = sunPath(entry.model, 5)[Math.min(47, Math.round(h * 2))]?.elev ?? 0;
          return (
            <circle
              key={entry.site.id}
              cx={scaleX(localTime)}
              cy={scaleY(value, domain.min, domain.max)}
              r={3.4}
              className={`chart-dot chart-dot--${entry.tone}`}
            />
          );
        })}
        {primarySample && (
          <g transform={`translate(${Math.min(W - PAD.right - 104, Math.max(PAD.left, scaleX(localTime) - 52))}, ${PAD.top + 2})`}>
            <rect width="104" height="34" rx="4" className="chart-chip" />
            <text x="9" y="13" className="chart-chip__label">
              {hoursToLabel(localTime)} LST
            </text>
            <text x="9" y="27" className="chart-chip__value">
              {primarySample.elev >= 0 ? "+" : "−"}
              {Math.abs(primarySample.elev).toFixed(1)}°
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}

function linePath(samples: Sample[], domain: { min: number; max: number }) {
  return samples
    .map((sample, index) => {
      const x = scaleX(sample.hour);
      const y = scaleY(sample.elev, domain.min, domain.max);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function EarthElevationChart({
  site,
  localTime,
  onScrub,
  height: _height = 240,
}: {
  site: Site;
  localTime: number;
  onScrub?: (hour: number) => void;
  height?: number;
}) {
  const model = useMemo(() => buildModel(site), [site]);
  const samples = useMemo(() => earthPath(model, 5), [model]);
  const domain = useMemo(() => elevationDomain(samples.map((s) => s.elev)), [samples]);
  const handle = useScrub(onScrub);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="chart chart--earth"
      role="img"
      aria-label={`24 hour geometric Earth elevation profile for ${site.name}.`}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        handle(event);
      }}
      onPointerMove={(event) => {
        if (event.buttons === 1) handle(event);
      }}
    >
      <defs>
        <linearGradient id="earth-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-earth)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--chart-earth)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <Grid min={domain.min} max={domain.max} />
      <path
        d={`${linePath(samples, domain)} L ${scaleX(24)} ${scaleY(domain.min, domain.min, domain.max)} L ${scaleX(0)} ${scaleY(domain.min, domain.min, domain.max)} Z`}
        fill="url(#earth-fill)"
      />
      <path d={linePath(samples, domain)} className="chart-line chart-line--earth" />
      <line
        x1={scaleX(localTime)}
        x2={scaleX(localTime)}
        y1={PAD.top}
        y2={H - PAD.bottom}
        className="chart-marker__line"
      />
      <circle
        cx={scaleX(localTime)}
        cy={scaleY(samples[Math.min(samples.length - 1, Math.round(localTime * 12))]?.elev ?? 0, domain.min, domain.max)}
        r={3.4}
        className="chart-dot chart-dot--earth"
      />
    </svg>
  );
}

export function VisibilityTimeline({
  intervals,
  localTime,
  onScrub,
  label,
  total = 24,
}: {
  intervals: Interval[];
  localTime: number;
  onScrub?: (hour: number) => void;
  label: string;
  total?: number;
}) {
  const width = 840;
  const height = 96;
  const pad = { left: 0, right: 0, top: 8, bottom: 26 };
  const x = (hour: number) => pad.left + (hour / total) * (width - pad.left - pad.right);
  const handle = useScrub((hour) => onScrub?.(hour));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="timeline"
      role="img"
      aria-label={`${label}. ${intervals.length} visible intervals over ${total} hours.`}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        handle(event);
      }}
      onPointerMove={(event) => {
        if (event.buttons === 1) handle(event);
      }}
    >
      <rect x={0} y={pad.top} width={width} height={22} rx={3} className="timeline__track" />
      {intervals.map((interval) => (
        <rect
          key={`${interval.start}-${interval.end}`}
          x={x(interval.start)}
          y={pad.top}
          width={Math.max(1.5, x(interval.end) - x(interval.start))}
          height={22}
          rx={2}
          className="timeline__interval"
        />
      ))}
      {Array.from({ length: 25 }, (_, i) => i).map((hour) => (
        <line
          key={hour}
          x1={x(hour)}
          x2={x(hour)}
          y1={pad.top}
          y2={pad.top + 22}
          className="timeline__tick"
          opacity={hour % 6 === 0 ? 1 : 0.3}
        />
      ))}
      <line
        x1={x(localTime)}
        x2={x(localTime)}
        y1={pad.top - 5}
        y2={pad.top + 27}
        className="timeline__cursor"
      />
      <circle cx={x(localTime)} cy={pad.top + 11} r={2.4} className="timeline__cursor-dot" />
      {[0, 6, 12, 18, 24].map((hour) => (
        <text key={hour} x={x(hour) + (hour === 24 ? -2 : 0)} y={height - 8} textAnchor={hour === 0 ? "start" : hour === 24 ? "end" : "middle"} className="chart-tick">
          {String(hour).padStart(2, "0")}:00
        </text>
      ))}
    </svg>
  );
}

export function SunAngleSpark({ site, localTime }: { site: Site; localTime: number }) {
  const model = useMemo(() => buildModel(site), [site]);
  const samples = useMemo(() => sunPath(model, 15), [model]);
  const domain = { min: -12, max: 12 };
  const width = 160;
  const height = 46;
  const sx = (hour: number) => (hour / 24) * width;
  const sy = (value: number) => ((domain.max - value) / (domain.max - domain.min)) * height;
  const current = samples[Math.min(samples.length - 1, Math.round(localTime * 4))]?.elev ?? 0;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="spark" aria-hidden="true">
      <path d={samples.map((s, i) => `${i === 0 ? "M" : "L"} ${sx(s.hour).toFixed(1)} ${sy(s.elev).toFixed(1)}`).join(" ")} className="spark__line" />
      <line x1={0} x2={width} y1={sy(0)} y2={sy(0)} className="spark__zero" />
      <line x1={sx(localTime)} x2={sx(localTime)} y1={0} y2={height} className="spark__cursor" />
      <circle cx={sx(localTime)} cy={sy(current)} r={2} className="spark__dot" />
    </svg>
  );
}
