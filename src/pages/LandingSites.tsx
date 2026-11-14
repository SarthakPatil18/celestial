import { useMission } from "../context/MissionContext";
import { Disclaimer, PageIntro } from "../components/layout/PageIntro";
import { Badge, Panel, PanelBody, PanelHead } from "../components/ui/Panel";
import { SiteAtlas } from "../components/viz/HorizonView";
import { SITES } from "../data/sites";
import {
  azimuthLabel,
  degreeLabel,
  durationLabel,
  hoursToLabel,
  percentLabel,
} from "../lib/mission";
import { Icon } from "../components/ui/Icon";

export function LandingSitesPage() {
  const { site, sun, earth, localTime, analysis, setSiteId, siteId } = useMission();

  return (
    <div className="page">
      <PageIntro title="Landing sites" />
      <Disclaimer />

      <div className="atlas-layout">
        <Panel className="panel--atlas panel--tech">
          <PanelHead title="South Polar Site Atlas" meta="ILLUSTRATIVE TERRAIN / RELATIVE SITE INDEX">
            <span className="panel-head__hint">
              <Icon name="target" size={12} /> SELECT A MARKER
            </span>
          </PanelHead>
          <div className="atlas-tags">
            <span>ILLUSTRATIVE SHADED RELIEF</span>
            <span>SOUTH POLAR REGION</span>
            <span>MARKERS NOT GEOREFERENCED</span>
          </div>
          <SiteAtlas selectedId={siteId} />
          <div className="atlas-foot">
            <span>
              <Icon name="layers" size={12} /> BASEMAP: LRO WAC SOUTH POLE MOSAIC
            </span>
            <span>NASA / GSFC / ARIZONA STATE UNIVERSITY · PUBLIC DOMAIN</span>
          </div>
        </Panel>

        <div className="atlas-side">
          <Panel className="panel--zone">
            <PanelHead title="Selected Landing Zone" meta="CURRENT REFERENCE SITE">
              <Badge tone="cyan" dot>
                {site.dataQuality.toUpperCase()}
              </Badge>
            </PanelHead>
            <PanelBody>
              <h3 className="zone-name">{site.name}</h3>
              <p className="zone-region">{site.region}</p>

              <div className="zone-coords">
                <div>
                  <span className="zone-coords__label">LATITUDE</span>
                  <span className="zone-coords__value">{Math.abs(site.lat).toFixed(2)}° S</span>
                </div>
                <div>
                  <span className="zone-coords__label">LONGITUDE</span>
                  <span className="zone-coords__value">{site.lon.toFixed(2)}° E</span>
                </div>
              </div>

              <div className="zone-metrics">
                <div className="zone-metric">
                  <span className="zone-metric__label">SAMPLE ELEVATION</span>
                  <span className="zone-metric__value">
                    +{site.elevation.toLocaleString()}
                    <small>m</small>
                  </span>
                  <span className="zone-metric__hint">±{site.elevationUncertainty} m sample range</span>
                </div>
                <div className="zone-metric">
                  <span className="zone-metric__label">MODELED SUNLIGHT</span>
                  <span className="zone-metric__value">
                    {percentLabel(analysis.geometricSunFraction)}
                  </span>
                  <span className="zone-metric__hint">
                    {durationLabel(analysis.geometricSunHours)} geometric / 24 h
                  </span>
                </div>
                <div className="zone-metric">
                  <span className="zone-metric__label">SOLAR ELEVATION</span>
                  <span className="zone-metric__value">{degreeLabel(sun.elev)}</span>
                  <span className="zone-metric__hint">AZ {azimuthLabel(sun.az)} · {hoursToLabel(localTime)} LST</span>
                </div>
                <div className="zone-metric">
                  <span className="zone-metric__label">EARTH VISIBILITY</span>
                  <span className={`zone-metric__value ${earth.elev > 0 ? "is-cyan" : ""}`}>
                    {earth.elev > 0 ? "VISIBLE" : "OCCLUDED"}
                  </span>
                  <span className="zone-metric__hint">
                    Geometric sample {degreeLabel(earth.elev)} elevation
                  </span>
                </div>
              </div>

              <div className="quality">
                <div className="quality__head">
                  <span>DATA QUALITY / UNCERTAINTY</span>
                  <span className="quality__grade">{site.dataQuality.toUpperCase()}</span>
                </div>
                <div className="quality__bar" aria-hidden="true">
                  <span style={{ width: site.dataQuality === "Sample" ? "58%" : "34%" }} />
                </div>
                <p>
                  Site labels and topography are illustrative examples. Elevations and illumination
                  figures require validation against authoritative lunar datasets.
                </p>
                <p className="quality__note">
                  Coordinates, elevation and sunlight values are concept samples — not verified
                  LOLA/SELENE products.
                </p>
              </div>

              <p className="zone-note">{site.note}</p>
            </PanelBody>
          </Panel>

          <Panel className="panel--catalog">
            <PanelHead title="Catalog" meta={`${SITES.length} SAMPLE SITES`}>
              <Badge tone="neutral">CLICK TO SELECT</Badge>
            </PanelHead>
            <ul className="catalog">
              {SITES.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`catalog__item ${item.id === siteId ? "is-active" : ""}`}
                    onClick={() => setSiteId(item.id)}
                    aria-pressed={item.id === siteId}
                  >
                    <span className="catalog__dot" aria-hidden="true" />
                    <span className="catalog__name">{item.name}</span>
                    <span className="catalog__coord">{Math.abs(item.lat).toFixed(1)}°S</span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
