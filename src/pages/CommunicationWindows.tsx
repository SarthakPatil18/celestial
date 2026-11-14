import { useEffect, useState } from "react";
import { useMission } from "../context/MissionContext";
import { Disclaimer, PageIntro } from "../components/layout/PageIntro";
import { Badge, Panel, PanelBody, PanelHead, ScientificNote } from "../components/ui/Panel";
import { TimeSlider } from "../components/ui/Controls";
import { EarthGeometry } from "../components/viz/HorizonView";
import { VisibilityTimeline } from "../components/viz/Charts";
import { azimuthLabel, degreeLabel, durationLabel, hoursToLabel } from "../lib/mission";
import { Icon } from "../components/ui/Icon";
import { fetchLiveDsn, type DsnSnapshot } from "../lib/dsn";

const LIMITATIONS = [
  "Antenna pointing and spacecraft attitude are not modelled.",
  "Terrain occultation uses site LOLA DEM horizon elevation.",
  "Link budget, data rate and power constraints are not evaluated.",
  "Ground-station scheduling relies on live JPL DSN Now telemetry.",
];

export function CommunicationWindowsPage() {
  const { site, earth, localTime, setLocalTime, analysis } = useMission();
  const [dsn, setDsn] = useState<DsnSnapshot | null>(null);
  const visible = earth.elev > site.earth.horizon;

  useEffect(() => {
    let active = true;
    fetchLiveDsn().then((snap) => {
      if (active) setDsn(snap);
    });
    return () => {
      active = false;
    };
  }, []);

  const primaryDish =
    dsn?.dishes.find((d) => d.targets.some((t) => t.isLunar)) ?? dsn?.dishes[0];

  return (
    <div className="page">
      <PageIntro title="Communication windows" />
      <Disclaimer />

      <div className="comm-top">
        <Panel className="panel--geometry panel--tech">
          <PanelHead
            title="Earth-Spacecraft Geometry"
            meta={`${site.shortName.toUpperCase()} → EARTH • EPHEMERIS`}
          >
            <Badge tone={visible ? "cyan" : "neutral"} dot>
              {visible ? "GEOMETRIC LOS" : "OCCLUDED"}
            </Badge>
          </PanelHead>
          <div className="geometry-frame">
            <EarthGeometry
              site={site}
              earthElev={earth.elev}
              earthAz={earth.az}
              visible={visible}
            />
          </div>
          <div className="panel-foot">
            <TimeSlider onScrub={setLocalTime} />
          </div>
        </Panel>

        <Panel className="panel--commstatus">
          <PanelHead title="Current Geometry" meta={`${hoursToLabel(localTime)} LST`}>
            <Badge tone={visible ? "cyan" : "neutral"}>
              {visible ? "ABOVE HORIZON" : "BELOW HORIZON"}
            </Badge>
          </PanelHead>
          <PanelBody>
            <div className={`comm-status ${visible ? "is-visible" : ""}`}>
              <span className="comm-status__label">EARTH VISIBILITY</span>
              <span className="comm-status__value">{visible ? "VISIBLE" : "OCCLUDED"}</span>
              <span className="comm-status__hint">ASTRONOMY-ENGINE LIBRATION</span>
            </div>

            <div className="comm-rows">
              <div>
                <span>EARTH ELEVATION</span>
                <strong>{degreeLabel(earth.elev)}</strong>
              </div>
              <div>
                <span>EARTH AZIMUTH</span>
                <strong>{azimuthLabel(earth.az)}</strong>
              </div>
              <div>
                <span>LOCAL TIME</span>
                <strong>{hoursToLabel(localTime)} LST</strong>
              </div>
              <div>
                <span>SELECTED SITE</span>
                <strong>{site.name}</strong>
              </div>
              <div>
                <span>VISIBLE WINDOW</span>
                <strong>{durationLabel(analysis.earthVisibleHours)}</strong>
              </div>
              <div>
                <span>LONGEST BLACKOUT</span>
                <strong>{durationLabel(analysis.longestBlackout)}</strong>
              </div>
            </div>

            <div className={`link-banner ${visible ? "is-visible" : ""}`}>
              <Icon name="signal" size={14} />
              <span>
                {visible
                  ? "Clear geometric line of sight above site horizon mask."
                  : "Earth below local horizon elevation at this sample time."}
              </span>
            </div>
          </PanelBody>
        </Panel>
      </div>

      <div className="comm-bottom">
        <Panel>
          <PanelHead
            title="Geometric Line-of-Sight Windows"
            meta="24 HOUR LOCAL COMMUNICATION GEOMETRY"
          >
            <span className="panel-head__hint">
              <i className="legend__swatch legend__swatch--earth" aria-hidden="true" />
              POTENTIAL VISIBILITY
            </span>
          </PanelHead>
          <PanelBody>
            <div className="window-lane">
              <div className="window-lane__head">
                <span>EARTH ABOVE THE LOCAL HORIZON</span>
                <strong>{durationLabel(analysis.earthVisibleHours)} / 24H</strong>
              </div>
              <VisibilityTimeline
                intervals={analysis.earthVisible}
                localTime={localTime}
                onScrub={setLocalTime}
                label="Potential Earth visibility windows"
              />
            </div>

            <div className="comm-stats">
              <div>
                <span>VISIBLE WINDOWS</span>
                <strong>{analysis.earthVisible.length}</strong>
              </div>
              <div>
                <span>LONGEST BLACKOUT</span>
                <strong>{durationLabel(analysis.longestBlackout)}</strong>
              </div>
              <div>
                <span>MODE</span>
                <strong>EPHEMERIS</strong>
              </div>
            </div>

            <TimeSlider onScrub={setLocalTime} variant="inline" />
            <ScientificNote>
              Occluded intervals are periods when the topocentric Earth elevation is below the
              local terrain horizon angle.
            </ScientificNote>
          </PanelBody>
        </Panel>

        <Panel className="panel--limits">
          <PanelHead title="Link Status | DSN Telemetry" meta="LIVE NASA JPL DSN NOW">
            <Badge tone={dsn?.source === "live-nasa-dsn" ? "cyan" : "neutral"}>
              {dsn?.source === "live-nasa-dsn" ? "LIVE DSN FEED" : "FALLBACK DSN"}
            </Badge>
          </PanelHead>
          <PanelBody>
            <h3 className="limits-title">Geometry vs. operational link</h3>
            <p className="limits-copy">
              Visibility is computed from real Lunar-Earth libration vectors. Active Deep Space
              Network complexes currently tracking lunar assets:
            </p>
            <ul className="limits-list">
              {dsn?.dishes.slice(0, 3).map((dish) => (
                <li key={dish.name}>
                  <Icon name="signal" size={12} />
                  <span>
                    <strong>
                      {dish.name} ({dish.complex})
                    </strong>{" "}
                    ·{" "}
                    {dish.targets[0]
                      ? `${dish.targets[0].name} · El ${dish.elevationDeg.toFixed(1)}° · RTLT ${dish.targets[0].rtltSec.toFixed(2)}s`
                      : `El ${dish.elevationDeg.toFixed(1)}°`}
                  </span>
                </li>
              ))}
              {LIMITATIONS.slice(0, 2).map((item) => (
                <li key={item}>
                  <Icon name="alert" size={12} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="limits-foot">
              <div>
                <span>PRIMARY LUNAR DISH</span>
                <strong>
                  {primaryDish
                    ? `${primaryDish.name} · ${primaryDish.complex.toUpperCase()}`
                    : "GOLDSTONE · DSN"}
                </strong>
              </div>
              <p>
                {primaryDish?.targets[0]
                  ? `Active downlink target: ${primaryDish.targets[0].name} (Az ${primaryDish.azimuthDeg.toFixed(1)}°)`
                  : "Polled via NASA Eyes DSN Now XML feed."}
              </p>
            </div>

            <ScientificNote>
              Geometric line-of-sight is combined with real-time NASA JPL DSN antenna tracking
              telemetry.
            </ScientificNote>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}