import { useMemo } from "react";
import type { Site } from "../../data/sites";
import { SITES } from "../../data/sites";
import { azimuthLabel, degreeLabel, hoursToLabel } from "../../lib/mission";
import { useMission } from "../../context/MissionContext";

/* --------------------------------------------------------------------------
   Deterministic helpers for the illustrative terrain + star field
   -------------------------------------------------------------------------- */

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function ridge(seed: number, points: number) {
  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    const n =
      Math.sin(t * 9.1 + seed) * 0.45 +
      Math.sin(t * 17.3 + seed * 2.3) * 0.28 +
      Math.sin(t * 31.7 + seed * 4.1) * 0.16 +
      (hash(i * 3.7 + seed) - 0.5) * 0.34;
    return n;
  });
}

function ridgePath(seed: number, baseY: number, amplitude: number, points = 120) {
  const values = ridge(seed, points);
  return values
    .map((value, index) => {
      const x = (index / (points - 1)) * 1000;
      const y = baseY + value * amplitude;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

/* --------------------------------------------------------------------------
   Horizon visualisation — the signature "science instrument" panel
   -------------------------------------------------------------------------- */

const VB_W = 1000;
const VB_H = 440;
const HORIZON_Y = 300;
const PX_PER_DEG = 7.4;

function altY(alt: number) {
  return HORIZON_Y - alt * PX_PER_DEG;
}
function azX(az: number) {
  return ((az % 360) / 360) * VB_W;
}

export function HorizonView({
  site,
  sunElev,
  sunAz,
  earthElev,
  earthAz,
  localTime,
  className = "",
}: {
  site: Site;
  sunElev: number;
  sunAz: number;
  earthElev: number;
  earthAz: number;
  localTime: number;
  className?: string;
}) {
  const stars = useMemo(() => {
    const seed = site.id.length * 3.3 + 11;
    return Array.from({ length: 58 }, (_, i) => ({
      x: hash(i * 1.7 + seed) * VB_W,
      y: hash(i * 2.9 + seed) * 250 + 12,
      r: hash(i * 5.3 + seed) * 1.1 + 0.25,
      o: 0.25 + hash(i * 7.1 + seed) * 0.6,
    }));
  }, [site.id]);

  const backRidge = useMemo(() => ridgePath(site.relief * 10 + 4, HORIZON_Y + 6, 26), [site.relief]);
  const midRidge = useMemo(() => ridgePath(site.relief * 7 + 2, HORIZON_Y + 20, 34), [site.relief]);
  const frontRidge = useMemo(() => ridgePath(site.relief * 5 + 9, HORIZON_Y + 52, 54), [site.relief]);

  const sunY = Math.max(20, Math.min(VB_H - 80, altY(sunElev)));
  const earthY = Math.max(20, Math.min(VB_H - 80, altY(earthElev)));
  const earthX = azX(earthAz);
  const sunX = azX(sunAz);

  const cardinals = [
    { az: 0, label: "N" },
    { az: 90, label: "E" },
    { az: 180, label: "S" },
    { az: 270, label: "W" },
  ];

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className={`horizon-view ${className}`}
      role="img"
      aria-label={`Illustrative local sky for ${site.name} at ${hoursToLabel(localTime)} local solar time. Sun altitude ${sunElev.toFixed(1)} degrees, azimuth ${sunAz.toFixed(0)}. Earth altitude ${earthElev.toFixed(1)} degrees, azimuth ${earthAz.toFixed(0)}.`}
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--sky-top)" />
          <stop offset="62%" stopColor="var(--sky-mid)" />
          <stop offset="100%" stopColor="var(--sky-horizon)" />
        </linearGradient>
        <linearGradient id="terrain-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--terrain-3)" />
          <stop offset="100%" stopColor="var(--terrain-1)" />
        </linearGradient>
        <linearGradient id="terrain-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--terrain-2)" />
          <stop offset="100%" stopColor="var(--terrain-0)" />
        </linearGradient>
        <radialGradient id="sun-glow">
          <stop offset="0%" stopColor="var(--amber)" stopOpacity="0.65" />
          <stop offset="45%" stopColor="var(--amber)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--amber)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="earth-glow">
          <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="horizon-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width={VB_W} height={VB_H} fill="url(#sky)" />
      <g className="stars">
        {stars.map((star, index) => (
          <circle key={index} cx={star.x} cy={star.y} r={star.r} fill="var(--text)" opacity={star.o * 0.55} />
        ))}
      </g>

      {/* altitude scale */}
      <g>
        {[20, 10].map((alt) => (
          <g key={alt}>
            <line
              x1={0}
              x2={VB_W}
              y1={altY(alt)}
              y2={altY(alt)}
              stroke="var(--grid-strong)"
              strokeDasharray="2 8"
            />
            <text x={10} y={altY(alt) - 5} className="hv-scale">
              +{alt}°
            </text>
          </g>
        ))}
        <text x={10} y={altY(0) + 14} className="hv-scale">
          0° HORIZON
        </text>
        {[-6, -12].map((alt) => (
          <g key={alt}>
            <line
              x1={0}
              x2={VB_W}
              y1={altY(alt)}
              y2={altY(alt)}
              stroke="var(--grid)"
              strokeDasharray="2 10"
            />
            <text x={10} y={altY(alt) + 12} className="hv-scale hv-scale--dim">
              {alt}°
            </text>
          </g>
        ))}
      </g>

      {/* azimuth ticks along the horizon */}
      <g opacity={0.8}>
        {Array.from({ length: 37 }, (_, i) => i * 10).map((az) => {
          const major = az % 90 === 0;
          return (
            <line
              key={az}
              x1={azX(az)}
              x2={azX(az)}
              y1={HORIZON_Y}
              y2={HORIZON_Y + (major ? 16 : 8)}
              stroke={major ? "var(--cyan-line)" : "var(--grid-strong)"}
            />
          );
        })}
      </g>

      {/* celestial markers */}
      <g className="hv-sun">
        <circle cx={sunX} cy={sunY} r={62} fill="url(#sun-glow)" opacity={sunElev > -8 ? 1 : 0.55} />
        <circle cx={sunX} cy={sunY} r={9} className="hv-sun__disc" />
        <g transform={`translate(${Math.min(VB_W - 160, Math.max(6, sunX + 16))}, ${Math.max(18, sunY - 16)})`}>
          <rect width="144" height="40" rx="4" className="hv-chip hv-chip--sun" />
          <text x="10" y="15" className="hv-chip__title">
            SUN
          </text>
          <text x="10" y="30" className="hv-chip__value">
            {degreeLabel(sunElev)} / AZ {azimuthLabel(sunAz)}
          </text>
        </g>
      </g>

      <g className="hv-earth">
        <circle cx={earthX} cy={earthY} r={40} fill="url(#earth-glow)" />
        <circle cx={earthX} cy={earthY} r={6.5} className="hv-earth__disc" />
        <g transform={`translate(${Math.min(VB_W - 170, Math.max(6, earthX + 14))}, ${Math.max(18, earthY - 16)})`}>
          <rect width="158" height="40" rx="4" className="hv-chip hv-chip--earth" />
          <text x="10" y="15" className="hv-chip__title">
            EARTH
          </text>
          <text x="10" y="30" className="hv-chip__value">
            {degreeLabel(earthElev)} / AZ {azimuthLabel(earthAz)}
          </text>
        </g>
      </g>

      {/* terrain */}
      <path d={`${ridgePath(site.relief * 10 + 4, HORIZON_Y + 4, 20)} L 1000 ${VB_H} L 0 ${VB_H} Z`} fill="url(#terrain-back)" opacity="0.82" />
      <path d={`${backRidge} L 1000 ${VB_H} L 0 ${VB_H} Z`} fill="url(#terrain-back)" opacity="0.9" />
      <path d={`${midRidge} L 1000 ${VB_H} L 0 ${VB_H} Z`} fill="url(#terrain-mid)" />
      <path d={`${frontRidge} L 1000 ${VB_H} L 0 ${VB_H} Z`} fill="var(--terrain-0)" />
      <path
        d={`${frontRidge} L 1000 ${VB_H} L 0 ${VB_H} Z`}
        fill="transparent"
        stroke="var(--border-strong)"
        strokeWidth="0.75"
        opacity="0.55"
      />

      {/* local horizon reference */}
      <line x1={0} x2={VB_W} y1={HORIZON_Y} y2={HORIZON_Y} className="hv-horizon" />
      <text x={VB_W - 12} y={HORIZON_Y - 8} textAnchor="end" className="hv-horizon-label">
        LOCAL HORIZON / SOUTH POLAR REFERENCE
      </text>
      <rect x={0} y={HORIZON_Y} width={VB_W} height={34} fill="url(#horizon-fade)" opacity="0.25" />

      {/* compass */}
      <g className="hv-compass">
        {cardinals.map((c) => {
          const x = azX(c.az);
          const anchor = x < 40 ? "start" : x > VB_W - 40 ? "end" : "middle";
          return (
            <g key={c.label}>
              <line x1={x} x2={x} y1={VB_H - 34} y2={VB_H - 22} stroke="var(--cyan-line)" />
              <text x={x} y={VB_H - 11} textAnchor={anchor} className="hv-cardinal">
                {c.label}
              </text>
            </g>
          );
        })}
        <text x={12} y={VB_H - 24} className="hv-fov">
          SIM AZIMUTH 000° / N
        </text>
        <text x={VB_W - 12} y={VB_H - 24} textAnchor="end" className="hv-fov">
          {hoursToLabel(localTime)} LST · 360° PANORAMA
        </text>
      </g>
    </svg>
  );
}

/* --------------------------------------------------------------------------
   Top-down site atlas with the LRO south pole mosaic basemap
   -------------------------------------------------------------------------- */

export function SiteAtlas({ selectedId }: { selectedId: string }) {
  const { setSiteId } = useMission();
  return (
    <div className="atlas">
      <div className="atlas__viewport">
        <img
          className="atlas__basemap"
          src="/south-pole-mosaic.jpg"
          alt="LRO Wide Angle Camera mosaic of the lunar south pole, used as an illustrative basemap"
          draggable={false}
        />
        <div className="atlas__grid" aria-hidden="true" />
        <div className="atlas__vignette" aria-hidden="true" />

        <span className="atlas__coordinate atlas__coordinate--n">85°00′ S</span>
        <span className="atlas__coordinate atlas__coordinate--s">90°00′ S</span>
        <span className="atlas__coordinate atlas__coordinate--w">180° W</span>
        <span className="atlas__coordinate atlas__coordinate--e">180° E</span>

        <div className="atlas__center" aria-hidden="true">
          <span />
        </div>

        {SITES.map((site) => {
          const active = site.id === selectedId;
          return (
            <button
              key={site.id}
              type="button"
              className={`atlas-marker ${active ? "is-active" : ""}`}
              style={{ left: `${site.atlas.x * 100}%`, top: `${site.atlas.y * 100}%` }}
              onClick={() => setSiteId(site.id)}
              aria-pressed={active}
              aria-label={`Select ${site.name}, ${site.category.toLowerCase()} at ${Math.abs(site.lat).toFixed(2)} degrees south`}
            >
              <span className="atlas-marker__ring" aria-hidden="true" />
              <span className="atlas-marker__dot" aria-hidden="true" />
              <span className="atlas-marker__label">
                <span className="atlas-marker__name">{site.name}</span>
                <span className="atlas-marker__meta">
                  {Math.abs(site.lat).toFixed(2)}°S
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="atlas__legend">
        <span className="atlas__legend-item">
          <i className="atlas__legend-dot atlas__legend-dot--active" /> SELECTED SITE
        </span>
        <span className="atlas__legend-item">
          <i className="atlas__legend-dot" /> CANDIDATE
        </span>
        <span className="atlas__legend-item atlas__legend-item--meta">
          BASEMAP: LRO WAC MOSAIC (NASA / GSFC / ASU)
        </span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Earth–spacecraft geometry schematic
   -------------------------------------------------------------------------- */

export function EarthGeometry({
  site,
  earthElev,
  earthAz,
  visible,
}: {
  site: Site;
  earthElev: number;
  earthAz: number;
  visible: boolean;
}) {
  const earthY = Math.max(70, Math.min(250, 210 - earthElev * 7));
  return (
    <svg
      viewBox="0 0 900 420"
      className="earth-geometry"
      role="img"
      aria-label={`Schematic Earth geometry for ${site.name}. Earth elevation ${earthElev.toFixed(1)} degrees, azimuth ${earthAz.toFixed(0)}. Geometric line of sight ${visible ? "above" : "below"} the local horizon.`}
    >
      <defs>
        <radialGradient id="eg-space" cx="50%" cy="0%" r="90%">
          <stop offset="0%" stopColor="var(--surface-3)" />
          <stop offset="100%" stopColor="var(--bg-deep)" />
        </radialGradient>
        <radialGradient id="eg-earth">
          <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0.35" />
        </radialGradient>
        <linearGradient id="eg-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--terrain-3)" />
          <stop offset="100%" stopColor="var(--terrain-1)" />
        </linearGradient>
      </defs>

      <rect width="900" height="420" fill="url(#eg-space)" rx="8" />

      {/* reference rings */}
      <g className="eg-rings">
        {[70, 120, 170].map((r) => (
          <circle key={r} cx="450" cy="360" r={r} fill="none" stroke="var(--grid-strong)" strokeDasharray="2 6" />
        ))}
        {[0, 30, 60].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <line
              key={angle}
              x1="450"
              y1="360"
              x2={450 + Math.cos(rad) * 260}
              y2={360 - Math.sin(rad) * 260}
              stroke="var(--grid-strong)"
              strokeDasharray="2 7"
            />
          );
        })}
      </g>

      {/* Earth */}
      <g>
        <circle cx="700" cy={earthY} r="54" fill="url(#eg-earth)" opacity="0.18" />
        <circle cx="700" cy={earthY} r="21" fill="var(--cyan)" opacity={visible ? 0.95 : 0.4} />
        <path
          d={`M ${700 - 21} ${earthY} a 21 21 0 0 0 42 0`}
          fill="var(--bg-deep)"
          opacity="0.45"
        />
        <text x="700" y={earthY - 32} textAnchor="middle" className="eg-label">
          EARTH
        </text>
        <text x="700" y={earthY + 44} textAnchor="middle" className="eg-sub">
          {degreeLabel(earthElev)} ELEVATION
        </text>
      </g>

      {/* line of sight */}
      <line
        x1="450"
        y1="356"
        x2="697"
        y2={earthY + 8}
        className={visible ? "eg-los eg-los--visible" : "eg-los eg-los--blocked"}
        strokeDasharray="7 5"
      />
      {!visible && (
        <g>
          <line x1="450" y1="356" x2="640" y2="300" className="eg-occluder" />
          <text x="610" y="290" className="eg-sub">
            TERRAIN OCCULTATION
          </text>
        </g>
      )}

      {/* local site */}
      <path d="M 0 420 L 0 366 Q 120 344 240 362 T 480 356 T 720 368 T 900 352 L 900 420 Z" fill="url(#eg-ground)" />
      <line x1="0" y1="360" x2="900" y2="360" stroke="var(--cyan-line)" strokeDasharray="3 6" />
      <text x="16" y="350" className="eg-sub">
        LOCAL HORIZON · 0° GEOMETRIC
      </text>
      <g transform="translate(450, 360)">
        <line x1="0" y1="0" x2="0" y2="-26" stroke="var(--cyan)" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="4" fill="var(--cyan)" />
        <text x="0" y="18" textAnchor="middle" className="eg-label">
          {site.shortName.toUpperCase()}
        </text>
        <text x="0" y="32" textAnchor="middle" className="eg-sub">
          AZ {azimuthLabel(earthAz)}
        </text>
      </g>

      <g transform="translate(24, 34)">
        <rect width="196" height="32" rx="4" className="eg-chip" />
        <text x="10" y="13" className="eg-chip__label">
          GEOMETRIC LINE OF SIGHT
        </text>
        <text x="10" y="25" className="eg-chip__value">
          {visible ? "ABOVE HORIZON" : "OCCLUDED"} · SCHEMATIC
        </text>
      </g>
    </svg>
  );
}

/* --------------------------------------------------------------------------
   Polar horizon compass reference
   -------------------------------------------------------------------------- */

export function PolarCompass({
  sunAz,
  earthAz,
  localTime,
  sunElev,
}: {
  sunAz: number;
  earthAz: number;
  localTime: number;
  sunElev: number;
}) {
  const R = 92;
  const C = 120;
  const pos = (az: number, radius = R) => {
    const rad = ((az - 90) * Math.PI) / 180;
    return { x: C + Math.cos(rad) * radius, y: C + Math.sin(rad) * radius };
  };
  const sunPos = pos(sunAz, R);
  const earthPos = pos(earthAz, R - 18);

  return (
    <svg viewBox="0 0 240 250" className="compass" role="img" aria-label={`Polar horizon reference. Sun azimuth ${sunAz.toFixed(0)} degrees, Earth azimuth ${earthAz.toFixed(0)} degrees.`}>
      <circle cx={C} cy={C} r={R} className="compass__ring" />
      <circle cx={C} cy={C} r={R - 18} className="compass__ring compass__ring--inner" />
      {Array.from({ length: 24 }, (_, i) => i * 15).map((az) => {
        const major = az % 90 === 0;
        const a = pos(az, R);
        const b = pos(az, R - (major ? 12 : 5));
        return (
          <line
            key={az}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            className={major ? "compass__tick compass__tick--major" : "compass__tick"}
          />
        );
      })}
      {[
        { az: 0, label: "N" },
        { az: 90, label: "E" },
        { az: 180, label: "S" },
        { az: 270, label: "W" },
      ].map((c) => {
        const p = pos(c.az, R + 15);
        return (
          <text key={c.label} x={p.x} y={p.y + 3} textAnchor="middle" className="compass__cardinal">
            {c.label}
          </text>
        );
      })}

      <line x1={C} y1={C} x2={sunPos.x} y2={sunPos.y} className="compass__ray compass__ray--sun" />
      <line x1={C} y1={C} x2={earthPos.x} y2={earthPos.y} className="compass__ray compass__ray--earth" />
      <circle cx={sunPos.x} cy={sunPos.y} r={5} className="compass__marker compass__marker--sun" />
      <circle cx={earthPos.x} cy={earthPos.y} r={4} className="compass__marker compass__marker--earth" />
      <circle cx={C} cy={C} r={3} className="compass__center" />
      <text x={C} y={C + 24} textAnchor="middle" className="compass__time">
        {hoursToLabel(localTime)}
      </text>
      <text x={C} y={C + 36} textAnchor="middle" className="compass__time-label">
        LST
      </text>

      <g transform="translate(14, 228)">
        <circle cx="4" cy="4" r="3" className="compass__marker compass__marker--sun" />
        <text x="14" y="7" className="compass__legend">
          SUN {azimuthLabel(sunAz)} · {degreeLabel(sunElev)}
        </text>
      </g>
      <g transform="translate(14, 240)">
        <circle cx="4" cy="0" r="3" className="compass__marker compass__marker--earth" />
        <text x="14" y="3" className="compass__legend">
          EARTH {azimuthLabel(earthAz)}
        </text>
      </g>
    </svg>
  );
}
