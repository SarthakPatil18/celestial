import { useMission } from "../context/MissionContext";
import { Disclaimer, PageIntro } from "../components/layout/PageIntro";
import { Badge, Panel, PanelBody, PanelHead, ScientificNote } from "../components/ui/Panel";
import { TimeSlider } from "../components/ui/Controls";
import { EarthGeometry } from "../components/viz/HorizonView";
import { VisibilityTimeline } from "../components/viz/Charts";
import { azimuthLabel, degreeLabel, durationLabel, hoursToLabel } from "../lib/mission";
import { Icon } from "../components/ui/Icon";

const LIMITATIONS = [
  "Antenna pointing and spacecraft attitude are not modelled.",
  "Terrain occultation uses a single illustrative horizon value.",
  "Link budget, data rate and power constraints are not evaluated.",
  "Ground-station scheduling and DSN availability are not included.",
];

export function CommunicationWindowsPage() {
  const { site, earth, localTime, setLocalTime, analysis } = useMission();
  const visible = earth.elev > 0;

  return (
    <div className="page">
      <PageIntro title="Communication windows" />
      <Disclaimer />

      <div className="comm-top">
        <Panel className="panel--geometry panel--tech">
          <PanelHead title="Earth-Spacecraft Geometry" meta={`${site.shortName.toUpperCase()} → EARTH • SCHEMATIC`}>
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
              <span className="comm-status__hint">GEOMETRIC SAMPLE ONLY</span>
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
                  ? "Potential geometric window — not an operational link."
                  : "No geometric line of sight at this sample time."}
              </span>
            </div>
          </PanelBody>
        </Panel>
      </div>

      <div className="comm-bottom">
        <Panel>
          <PanelHead title="Geometric Line-of-Sight Windows" meta="24 HOUR LOCAL COMMUNICATION GEOMETRY">
            <span className="panel-head__hint">
              <i className="legend__swatch legend__swatch--earth" aria-hidden="true" />
              POTENTIAL VISIBILITY
            </span>
          </PanelHead>
          <PanelBody>
            <div className="window-lane">
              <div className="window-lane__head">
                <span>EARTH ABOVE THE ILLUSTRATIVE HORIZON</span>
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
                <strong>GEOMETRIC</strong>
              </div>
            </div>

            <TimeSlider onScrub={setLocalTime} variant="inline" />
            <ScientificNote>
              Occluded intervals are simply periods when the modelled Earth elevation is below the
              local horizon. They are not scheduled communication outages.
            </ScientificNote>
          </PanelBody>
        </Panel>

        <Panel className="panel--limits">
          <PanelHead title="Link Status | Limitations" meta="READ BEFORE USE">
            <Badge tone="neutral">NO DSN INTEGRATION</Badge>
          </PanelHead>
          <PanelBody>
            <h3 className="limits-title">Geometry ≠ operational link</h3>
            <p className="limits-copy">
              Visibility here represents a simple modeled Earth elevation. It does not guarantee a
              communications link. The following constraints are outside this concept model:
            </p>
            <ul className="limits-list">
              {LIMITATIONS.map((item) => (
                <li key={item}>
                  <Icon name="alert" size={12} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="limits-foot">
              <div>
                <span>DSN STATION</span>
                <strong>GOLDSTONE · REFERENCE ONLY</strong>
              </div>
              <p>No real pass schedule or station assignment is implied.</p>
            </div>

            <ScientificNote>
              This panel reports geometry only. It is not a link budget, contact plan or flight
              dynamics product.
            </ScientificNote>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
