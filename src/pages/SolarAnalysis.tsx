import { useMission } from "../context/MissionContext";
import { Disclaimer, PageIntro } from "../components/layout/PageIntro";
import { Badge, Legend, Panel, PanelBody, PanelHead, ScientificNote } from "../components/ui/Panel";
import { TimeSlider } from "../components/ui/Controls";
import { PolarSolarProfile, VisibilityTimeline } from "../components/viz/Charts";
import { SITES } from "../data/sites";
import {
  azimuthLabel,
  cachedAnalysis,
  degreeLabel,
  durationLabel,
  hoursToLabel,
  percentLabel,
} from "../lib/mission";

export function SolarAnalysisPage() {
  const { site, sun, localTime, setLocalTime, analysis } = useMission();

  return (
    <div className="page">
      <PageIntro title="Solar analysis" />
      <Disclaimer />

      <div className="stat-grid">
        <StatCard
          label="Current sun angle"
          value={degreeLabel(sun.elev)}
          unit={`AZ ${azimuthLabel(sun.az)}`}
          tone="amber"
          foot={sun.elev > 0 ? "Above geometric horizon" : "Below geometric horizon"}
        />
        <StatCard
          label="Modeled illumination"
          value={percentLabel(analysis.geometricSunFraction)}
          unit="GEOMETRIC / 24 H"
          tone="purple"
          foot={`Terrain-adjusted ${percentLabel(analysis.terrainSunFraction)}`}
          meter={analysis.geometricSunFraction}
        />
        <StatCard
          label="Sun above horizon"
          value={analysis.geometricSunHours.toFixed(1)}
          unit="HOURS"
          tone="amber"
          foot={`Terrain-adjusted ${analysis.terrainSunHours.toFixed(1)} h`}
          meter={analysis.geometricSunFraction}
        />
        <StatCard
          label="Sunrise / shadow"
          value={hoursToLabel(analysis.terrainSunrise ?? 0)}
          unit={hoursToLabel(analysis.terrainSunset ?? 0)}
          tone="cyan"
          foot="Illustrative transition windows"
          split
        />
      </div>

      <Panel className="panel--chart panel--full">
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
            height={330}
          />
          <div className="chart-foot">
            <span>
              <Badge tone="amber">{site.name.toUpperCase()}</Badge> SELECTED {hoursToLabel(localTime)} ·{" "}
              {degreeLabel(sun.elev)}
            </span>
            <span>ZERO LINE = GEOMETRIC HORIZON, NOT TERRAIN SHADOW</span>
          </div>
          <div className="panel-foot panel-foot--inset">
            <TimeSlider onScrub={setLocalTime} />
          </div>
        </PanelBody>
      </Panel>

      <div className="solar-lower">
        <Panel>
          <PanelHead title="Modeled Illumination Windows" meta="24 HOUR LOCAL SOL">
            <Legend
              items={[
                { label: "GEOMETRIC", tone: "sun" },
                { label: "TERRAIN-ADJUSTED", tone: "muted" },
              ]}
            />
          </PanelHead>
          <PanelBody>
            <div className="window-lane">
              <div className="window-lane__head">
                <span>SUN ABOVE 0° HORIZON</span>
                <strong>{durationLabel(analysis.geometricSunHours)}</strong>
              </div>
              <VisibilityTimeline
                intervals={analysis.sunGeometric}
                localTime={localTime}
                onScrub={setLocalTime}
                label="Geometric sunlight windows"
              />
            </div>
            <div className="window-lane">
              <div className="window-lane__head">
                <span>SUN ABOVE {site.sun.terrainHorizon.toFixed(1)}° TERRAIN MASK</span>
                <strong>{durationLabel(analysis.terrainSunHours)}</strong>
              </div>
              <VisibilityTimeline
                intervals={analysis.sunTerrain}
                localTime={localTime}
                onScrub={setLocalTime}
                label="Terrain adjusted sunlight windows"
              />
            </div>
            <ScientificNote>
              Geometric elevation ignores local topography. The lower lane applies a single
              illustrative horizon obstruction for this site and should not be read as a validated
              shadow model.
            </ScientificNote>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Energy Harvest / Schematic" meta="RELATIVE SOLAR AVAILABILITY">
            <Badge tone="purple">INDEX ONLY</Badge>
          </PanelHead>
          <PanelBody>
            <div className="harvest">
              <div className="harvest__big">
                <span className="harvest__value">{(analysis.terrainSunFraction * 100).toFixed(0)}</span>
                <span className="harvest__unit">RELATIVE INDEX</span>
              </div>
              <p className="harvest__copy">
                A normalized share of the 24-hour local sol above the modelled terrain mask. No
                array area, efficiency, temperature or storage model is applied.
              </p>
            </div>

            <div className="bars">
              {SITES.map((item) => {
                const a = cachedAnalysis(item);
                const active = item.id === site.id;
                return (
                  <div key={item.id} className={`bar-row ${active ? "is-active" : ""}`}>
                    <span className="bar-row__name">{item.shortName}</span>
                    <div className="bar-row__track">
                      <span
                        className="bar-row__fill bar-row__fill--geometric"
                        style={{ width: `${a.geometricSunFraction * 100}%` }}
                      />
                      <span
                        className="bar-row__fill bar-row__fill--terrain"
                        style={{ width: `${a.terrainSunFraction * 100}%` }}
                      />
                    </div>
                    <span className="bar-row__value">{percentLabel(a.terrainSunFraction)}</span>
                  </div>
                );
              })}
            </div>
            <Legend
              items={[
                { label: "GEOMETRIC", tone: "sun" },
                { label: "TERRAIN-ADJUSTED", tone: "muted" },
              ]}
            />
            <div className="harvest__grid">
              <div>
                <span>GEOMETRIC</span>
                <strong>{percentLabel(analysis.geometricSunFraction)}</strong>
              </div>
              <div>
                <span>TERRAIN-ADJUSTED</span>
                <strong>{percentLabel(analysis.terrainSunFraction)}</strong>
              </div>
              <div>
                <span>LONGEST DARKNESS</span>
                <strong>{durationLabel(analysis.longestDarkness)}</strong>
              </div>
            </div>
            <ScientificNote>
              Relative index only. Actual energy harvest depends on array geometry, pointing,
              temperature, dust and power architecture — none of which are modelled here.
            </ScientificNote>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  tone,
  foot,
  meter,
  split,
}: {
  label: string;
  value: string;
  unit: string;
  tone: "amber" | "cyan" | "purple";
  foot: string;
  meter?: number;
  split?: boolean;
}) {
  return (
    <article className={`stat stat--${tone}`}>
      <div className="stat__head">
        <span className="stat__label">{label}</span>
        <span className={`stat__dot stat__dot--${tone}`} aria-hidden="true" />
      </div>
      <div className={`stat__value-row ${split ? "stat__value-row--split" : ""}`}>
        <span className="stat__value">{value}</span>
        <span className="stat__unit">{unit}</span>
      </div>
      {typeof meter === "number" ? (
        <div className="stat__meter" aria-hidden="true">
          <span style={{ width: `${meter * 100}%` }} />
        </div>
      ) : null}
      <p className="stat__foot">{foot}</p>
    </article>
  );
}
