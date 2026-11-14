import { useEffect, useState } from "react";
import { useMission } from "../context/MissionContext";
import { Disclaimer, SectionHead } from "../components/layout/PageIntro";
import { Badge, DataRow, Legend, Panel, PanelBody, PanelHead } from "../components/ui/Panel";
import {
  ActionButton,
  DateSelect,
  DurationSelect,
  SiteSelect,
  TimeSlider,
} from "../components/ui/Controls";
import { Icon } from "../components/ui/Icon";
import { HorizonView } from "../components/viz/HorizonView";
import { PolarSolarProfile, SunAngleSpark } from "../components/viz/Charts";
import { MoonGlobe } from "../components/MoonGlobe";
import { SITES } from "../data/sites";
import {
  azimuthLabel,
  degreeLabel,
  durationLabel,
  hoursToLabel,
  percentLabel,
} from "../lib/mission";

export function OverviewPage() {
  const {
    site,
    sun,
    earth,
    localTime,
    setLocalTime,
    analysis,
    navigate,
    dateLabel,
    durationDays,
    siteId,
    setSiteId,
  } = useMission();
  const [tracked, setTracked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [relief, setRelief] = useState(true);
  const [illumination, setIllumination] = useState(true);
  const [showEarth, setShowEarth] = useState(true);
  const [cameraCommand, setCameraCommand] = useState<{ mode: "focus" | "reset"; id: number } | null>(null);
  const focusSite = () => setCameraCommand({ mode: "focus", id: Date.now() });

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setLocalTime((localTime + 0.12) % 24), 1000);
    return () => window.clearInterval(timer);
  }, [playing, localTime, setLocalTime]);

  return (
    <div className="page page--overview">
      <section className="hero moon-workspace" aria-labelledby="hero-title">
        <div className="hero__media"><MoonGlobe site={site} sunElev={sun.elev} sunAz={sun.az} earthElev={earth.elev} earthAz={earth.az} relief={relief} illumination={illumination} showEarth={showEarth} cameraCommand={cameraCommand} onSelect={id => { setSiteId(id); setCameraCommand({ mode: "focus", id: Date.now() }); }} /></div>
        <div className="hero__scrim" aria-hidden="true" />
        <div className="hero__grid" aria-hidden="true" />

        <div className="hero__content moon-title">
          <p className="hero__eyebrow">
            <span className="hero__eyebrow-line" aria-hidden="true" />
            LUNAR NAVIGATION / SOUTH POLAR REGION
          </p>
          <h1 id="hero-title" className="hero__title">
            LUNAR HORIZON
          </h1>
          <p className="hero__subtitle">Live surface view · geometric preview</p>
          <div className="hero__actions">
            <ActionButton
              variant="primary"
              onClick={() => document.getElementById("overview-dashboard")?.scrollIntoView({ behavior: "smooth" })}
            >
              Mission dashboard
            </ActionButton>
            <button
              type="button"
              className="hero__link"
              onClick={() => navigate("landing-sites")}
            >
              <Icon name="pin" size={13} /> Landing sites
            </button>
          </div>
        </div>

        <aside className="site-acq moon-site" aria-label="Selected landing site">
          <div className="site-acq__head">
            <span className="site-acq__title">LANDING SITE</span>
            <span className="site-acq__pulse" aria-hidden="true" />
          </div>
          <label className="moon-site__select-label">CANDIDATE REGION<select className="moon-site__select" value={siteId} onChange={e => { setSiteId(e.target.value); setCameraCommand({ mode: "focus", id: Date.now() }); }}>{SITES.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <div className="moon-site__preview"><img src="/south-pole-mosaic.jpg" alt="Lunar south pole surface map" /><span>{site.region.toUpperCase()} / {site.dataQuality.toUpperCase()}</span></div>
          <p className="site-acq__name">{site.name}</p>
          <p className="site-acq__coords">
            {Math.abs(site.lat).toFixed(2)}° S / {((site.lon % 360 + 360) % 360).toFixed(2)}° E
          </p>
          <div className="site-acq__grid">
            <div>
              <span className="site-acq__label">LOCAL ELEVATION</span><span className="site-acq__value">+{site.elevation.toLocaleString()} m</span>
            </div>
            <div>
              <span className="site-acq__label">TERRAIN</span><span className="site-acq__value">{site.category.toUpperCase()}</span>
            </div>
          </div>
          <div className="moon-site__buttons"><button type="button" onClick={()=>navigate("mission-comparison")}>Compare sites ↗</button><button type="button" onClick={focusSite}>Focus region ⌖</button></div>
          <div className="site-acq__foot">
            <span>{hoursToLabel(localTime)} LST</span>
            <span>{dateLabel}</span>
          </div>
        </aside>

        <aside className="moon-telemetry" aria-label="Live Sun and Earth telemetry">
          <div className="moon-telemetry__section moon-telemetry__sun"><header><span>☼</span>SUN <b>{sun.elev > 0 ? "ABOVE HORIZON" : "BELOW HORIZON"}</b></header><strong>{degreeLabel(sun.elev)}</strong><div><span>AZIMUTH</span><b>{azimuthLabel(sun.az)}</b></div><div><span>SOLAR AVAILABILITY / 24H</span><b>{percentLabel(analysis.geometricSunFraction)}</b></div></div>
          <div className="moon-telemetry__section moon-telemetry__earth"><header><span>◉</span>EARTH <b>{earth.elev > 0 ? "VISIBLE" : "BELOW HORIZON"}</b></header><strong>{degreeLabel(earth.elev)}</strong><div><span>AZIMUTH</span><b>{azimuthLabel(earth.az)}</b></div><div><span>GEOMETRIC LINK / 24H</span><b>{percentLabel(analysis.earthVisibleFraction)}</b></div></div>
          <small>ILLUSTRATIVE SPHERICAL MODEL · NOT FLIGHT DATA</small>
        </aside>

        <div className="moon-scene-controls" aria-label="Moon view controls"><button type="button" onClick={focusSite} title="Focus selected landing site">◎</button><button type="button" onClick={()=>setCameraCommand({mode:"reset",id:Date.now()})} title="Reset camera">⟲</button><i/><button type="button" className={relief?"is-on":""} onClick={()=>setRelief(x=>!x)} title="Toggle terrain relief">⌗</button><button type="button" className={illumination?"is-on":""} onClick={()=>setIllumination(x=>!x)} title="Toggle illumination">☼</button><button type="button" className={showEarth?"is-on":""} onClick={()=>setShowEarth(x=>!x)} title="Toggle Earth visualization">◉</button><button type="button" onClick={()=>document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.()} title="Fullscreen">⛶</button></div>

        <div className="moon-timeline"><div className="moon-timeline__top"><span>MISSION TIMELINE</span><b>{dateLabel} · {hoursToLabel(localTime)} LST</b><span>{durationDays} DAY WINDOW</span></div><div className="moon-timeline__controls"><button type="button" onClick={()=>setLocalTime((localTime+23.75)%24)} title="Step backward 15 minutes">‹</button><button type="button" className="moon-play" onClick={()=>setPlaying(x=>!x)} title={playing?"Pause":"Play"}>{playing?"Ⅱ":"▶"}</button><button type="button" onClick={()=>setLocalTime((localTime+.25)%24)} title="Step forward 15 minutes">›</button><input aria-label="Mission local time" type="range" min="0" max="23.99" step=".01" value={localTime} onChange={e=>setLocalTime(Number(e.target.value))}/><span>{hoursToLabel(localTime)} LST</span></div></div>

        <div className="hero__meta">
          <span>
            <Icon name="layers" size={12} /> SOUTH POLAR HIGHLANDS · ILLUSTRATIVE TERRAIN
          </span>
          <span className="hero__meta-credit">APOLLO 17 PANORAMA · NASA / PUBLIC DOMAIN</span>
        </div>
      </section>

      <div id="overview-dashboard" className="overview-dashboard">
        <SectionHead kicker="LIVE MISSION TELEMETRY" title="South pole overview">
          <div className="section-head__controls">
            <DateSelect />
            <SiteSelect />
            <DurationSelect />
          </div>
        </SectionHead>

        <Disclaimer />

        <div className="overview-main">
          <Panel className="panel--horizon panel--tech">
            <PanelHead
              title="Horizon Simulator"
              meta={`SOUTH POLAR SKY • ${site.name.toUpperCase()}`}
            >
              <Badge tone="amber" dot>
                SUN {degreeLabel(sun.elev)}
              </Badge>
              <Badge tone="cyan" dot>
                EARTH {degreeLabel(earth.elev)}
              </Badge>
            </PanelHead>
            <div className="horizon-frame">
              <HorizonView
                site={site}
                sunElev={sun.elev}
                sunAz={sun.az}
                earthElev={earth.elev}
                earthAz={earth.az}
                localTime={localTime}
              />
              <div className="horizon-frame__stamp">
                <span>GEOMETRIC PROJECTION</span>
                <span>NOT INSTRUMENT-CALIBRATED</span>
              </div>
            </div>
            <div className="panel-foot">
              <TimeSlider onScrub={setLocalTime} />
            </div>
          </Panel>

          <div className="metric-grid">
            <MetricCard
              label="Solar elevation"
              value={degreeLabel(sun.elev)}
              tone="amber"
              status={sun.elev > 0 ? "ABOVE HORIZON" : "BELOW HORIZON"}
              footer={`AZ ${azimuthLabel(sun.az)} · ${hoursToLabel(localTime)} LST`}
              spark={<SunAngleSpark site={site} localTime={localTime} />}
            />
            <MetricCard
              label="Earth elevation"
              value={degreeLabel(earth.elev)}
              tone="cyan"
              status={earth.elev > 0 ? "ABOVE HORIZON" : "OCCLUDED"}
              footer={`AZ ${azimuthLabel(earth.az)} · GEOMETRIC`}
            />
            <MetricCard
              label="Site illumination"
              value={percentLabel(analysis.geometricSunFraction)}
              tone="purple"
              status={`${durationLabel(analysis.geometricSunHours)} / 24H`}
              footer="GEOMETRIC ABOVE-HORIZON FRACTION"
              meter={analysis.geometricSunFraction}
              extra={`Terrain-adjusted ${percentLabel(analysis.terrainSunFraction)}`}
            />
            <MetricCard
              label="Earth line-of-sight"
              value={earth.elev > 0 ? "VISIBLE" : "OCCLUDED"}
              tone="cyan"
              status={earth.elev > 0 ? "POTENTIAL LOS" : "NO LINE OF SIGHT"}
              footer="GEOMETRY ONLY · NO LINK BUDGET"
              meter={analysis.earthVisibleFraction}
              extra={`${durationLabel(analysis.earthVisibleHours)} potential / 24H`}
            />
          </div>
        </div>

        <div className="overview-lower">
          <Panel className="panel--chart">
            <PanelHead title="Polar Solar Profile" meta="SUN ELEVATION / 24 HOUR LOCAL SOL">
              <Legend
                items={[
                  { label: "SUN", tone: "sun" },
                  { label: "TERRAIN THRESHOLD", tone: "muted", dashed: true },
                ]}
              />
            </PanelHead>
            <PanelBody className="panel-body--chart">
              <PolarSolarProfile
                series={[{ site, tone: "sun", label: site.name }]}
                localTime={localTime}
                onScrub={setLocalTime}
              />
              <div className="chart-foot">
                <span>
                  <Icon name="alert" size={11} /> Schematic sinusoid fitted to the 16:50 LST sample —
                  not an ephemeris.
                </span>
                <span>
                  SELECTED {hoursToLabel(localTime)} · {degreeLabel(sun.elev)}
                </span>
              </div>
            </PanelBody>
          </Panel>

          <Panel className="panel--mission">
            <PanelHead title="Mission Overview" meta="CURRENT CONFIGURATION">
              <Badge tone="neutral">{durationDays}D WINDOW</Badge>
            </PanelHead>
            <PanelBody>
              <div className="mission-site">
                <div className="mission-site__mono">
                  <span className="mission-site__mark" aria-hidden="true">
                    {site.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div>
                    <p className="mission-site__name">{site.name}</p>
                    <p className="mission-site__cat">{site.region}</p>
                  </div>
                </div>
                <Badge tone={tracked ? "cyan" : "neutral"}>{tracked ? "TRACKING" : "CANDIDATE"}</Badge>
              </div>

              <div className="mission-rows">
                <DataRow
                  label="COORDINATES"
                  value={`${Math.abs(site.lat).toFixed(2)}° S • ${site.lon.toFixed(2)}° E`}
                />
                <DataRow label="LOCAL ELEVATION" value={`+${site.elevation.toLocaleString()} m`} />
                <DataRow
                  label="SOLAR AVAILABILITY"
                  value={`${percentLabel(analysis.geometricSunFraction)} geometric`}
                  tone="amber"
                  hint={`${percentLabel(analysis.terrainSunFraction)} after terrain obstruction`}
                />
                <DataRow
                  label="CURRENT MISSION TIME"
                  value={`${hoursToLabel(localTime)} LST`}
                  hint={dateLabel}
                />
              </div>

              <div className="panel-actions">
                <ActionButton variant="primary" onClick={() => navigate("landing-sites")}>
                  Explore Landing Sites
                </ActionButton>
                <button
                  type="button"
                  className={`btn btn--ghost ${tracked ? "is-active" : ""}`}
                  onClick={() => setTracked((value) => !value)}
                  aria-pressed={tracked}
                >
                  {tracked ? "Tracking Site" : "Track Site"}
                  <Icon name="target" size={14} />
                </button>
              </div>
            </PanelBody>
          </Panel>
        </div>

        <div className="feature-grid">
          <FeatureCard
            kicker="COMMUNICATION GEOMETRY"
            title="Earth line-of-sight"
            copy="Geometric visibility only — no link budget or DSN pass is implied."
            action="View windows"
            onClick={() => navigate("communication-windows")}
          />
          <FeatureCard
            kicker="POLAR ILLUMINATION"
            title="Intermittent sunlight"
            copy={`Site reference: approximately ${percentLabel(analysis.geometricSunFraction)} illumination in this sample model.`}
            action="Inspect solar analysis"
            onClick={() => navigate("solar-analysis")}
          />
          <FeatureCard
            kicker="SITE TRADE STUDY"
            title="3 sites in catalog"
            copy="Compare elevation, modeled sunlight, and Earth visibility side by side."
            action="Compare sites"
            onClick={() => navigate("mission-comparison")}
          />
        </div>
      </div>
    </div>
  );
}
function MetricCard({
  label,
  value,
  tone,
  status,
  footer,
  meter,
  extra,
  spark,
}: {
  label: string;
  value: string;
  tone: "amber" | "cyan" | "purple";
  status: string;
  footer: string;
  meter?: number;
  extra?: string;
  spark?: React.ReactNode;
}) {
  return (
    <article className={`metric metric--${tone}`}>
      <div className="metric__head">
        <span className="metric__label">{label}</span>
        <span className="metric__status">{status}</span>
      </div>
      <div className="metric__value-row">
        <span className="metric__value">{value}</span>
        {spark ? <span className="metric__spark">{spark}</span> : null}
      </div>
      {typeof meter === "number" ? (
        <div className="metric__meter" aria-hidden="true">
          <span style={{ width: `${Math.max(4, Math.min(100, meter * 100))}%` }} />
        </div>
      ) : null}
      <div className="metric__foot">
        <span>{footer}</span>
        {extra ? <span className="metric__extra">{extra}</span> : null}
      </div>
    </article>
  );
}

function FeatureCard({
  kicker,
  title,
  copy,
  action,
  onClick,
}: {
  kicker: string;
  title: string;
  copy: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <article className="feature">
      <p className="feature__kicker">
        <span aria-hidden="true" />
        {kicker}
      </p>
      <h3 className="feature__title">{title}</h3>
      <p className="feature__copy">{copy}</p>
      <button type="button" className="feature__action" onClick={onClick}>
        {action} <Icon name="arrow" size={13} />
      </button>
    </article>
  );
}
