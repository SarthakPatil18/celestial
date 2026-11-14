import { useMission } from "../context/MissionContext";
import { Disclaimer, PageIntro } from "../components/layout/PageIntro";
import { Badge, Legend, Panel, PanelBody, PanelHead, ScientificNote } from "../components/ui/Panel";
import { ActionButton, TimeSlider } from "../components/ui/Controls";
import { HorizonView, PolarCompass } from "../components/viz/HorizonView";
import { PolarSolarProfile } from "../components/viz/Charts";
import { azimuthLabel, degreeLabel, hoursToLabel } from "../lib/mission";

export function HorizonSimulatorPage() {
  const { site, sun, earth, localTime, setLocalTime, navigate } = useMission();

  return (
    <div className="page">
      <PageIntro title="Horizon simulator" />
      <Disclaimer />

      <div className="sim-layout">
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
              <span>SIM AZIMUTH 000° / N</span>
              <span>{hoursToLabel(localTime)} LST</span>
            </div>
          </div>
          <div className="panel-foot">
            <TimeSlider onScrub={setLocalTime} />
          </div>
        </Panel>

        <div className="sim-side">
          <Panel className="panel--celestial">
            <PanelHead title="Selected Celestial Geometry" meta={`${hoursToLabel(localTime)} LST`}>
              <Badge tone="neutral">LIVE MODEL</Badge>
            </PanelHead>
            <PanelBody>
              <div className="bigtime">
                <span className="bigtime__value">{hoursToLabel(localTime)}</span>
                <span className="bigtime__unit">LST</span>
              </div>
              <div className="geometry-rows">
                <div className="geometry-row">
                  <span className="geometry-row__label">SUN · ALT / AZ</span>
                  <span className="geometry-row__value geometry-row__value--sun">
                    {degreeLabel(sun.elev)} / {azimuthLabel(sun.az)}
                  </span>
                  <span className="geometry-row__meta">
                    {sun.elev > 0 ? "ABOVE LOCAL HORIZON" : "BELOW LOCAL HORIZON"}
                  </span>
                </div>
                <div className="geometry-row">
                  <span className="geometry-row__label">EARTH · ALT / AZ</span>
                  <span className="geometry-row__value geometry-row__value--earth">
                    {degreeLabel(earth.elev)} / {azimuthLabel(earth.az)}
                  </span>
                  <span className="geometry-row__meta">
                    {earth.elev > 0 ? "GEOMETRIC LINE OF SIGHT" : "BELOW LOCAL HORIZON"}
                  </span>
                </div>
                <div className="geometry-row">
                  <span className="geometry-row__label">SITE ELEVATION</span>
                  <span className="geometry-row__value">+{site.elevation.toLocaleString()} m</span>
                  <span className="geometry-row__meta">ILLUSTRATIVE CATALOG VALUE</span>
                </div>
              </div>
              <ActionButton variant="ghost" size="sm" onClick={() => navigate("solar-analysis")}>
                Inspect solar analysis
              </ActionButton>
            </PanelBody>
          </Panel>

          <Panel className="panel--compass">
            <PanelHead title="Polar Horizon Reference" meta="ANGULAR GUIDES" />
            <PanelBody className="panel-body--compass">
              <PolarCompass
                sunAz={sun.az}
                earthAz={earth.az}
                localTime={localTime}
                sunElev={sun.elev}
              />
              <div className="compass-rows">
                <div>
                  <span>SELECTED SUN AZIMUTH</span>
                  <strong>{azimuthLabel(sun.az)}</strong>
                </div>
                <div>
                  <span>LOCAL TIME</span>
                  <strong>{hoursToLabel(localTime)} LST</strong>
                </div>
              </div>
              <ScientificNote>
                Angular guides show an illustrative local sky projection, not an
                instrument-calibrated topographic horizon profile.
              </ScientificNote>
            </PanelBody>
          </Panel>
        </div>
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
            height={280}
          />
          <div className="chart-foot">
            <span>SELECTED {hoursToLabel(localTime)} LST · SUN {degreeLabel(sun.elev)}</span>
            <span>DRAG CHART OR USE SLIDER TO SCRUB LOCALLY</span>
          </div>
        </PanelBody>
      </Panel>
    </div>
  );
}
