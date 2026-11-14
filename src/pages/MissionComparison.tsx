import { useMemo } from "react";
import { useMission } from "../context/MissionContext";
import { Disclaimer, PageIntro } from "../components/layout/PageIntro";
import { Badge, Legend, Panel, PanelBody, PanelHead, ScientificNote } from "../components/ui/Panel";
import { DateSelect, DurationSelect, TimeSlider } from "../components/ui/Controls";
import { PolarSolarProfile, VisibilityTimeline } from "../components/viz/Charts";
import { Icon } from "../components/ui/Icon";
import { SITES, type Site } from "../data/sites";
import {
  azimuthLabel,
  buildModel,
  cachedAnalysis,
  degreeLabel,
  durationLabel,
  earthAt,
  hoursToLabel,
  percentLabel,
  sunAt,
  type SiteAnalysis,
} from "../lib/mission";

const TONES = ["sun", "earth", "field"] as const;

interface CompareEntry {
  site: Site;
  analysis: SiteAnalysis;
  sunElev: number;
  sunAz: number;
  earthElev: number;
  earthAz: number;
  tone: (typeof TONES)[number];
  letter: string;
}

export function MissionComparisonPage() {
  const {
    compareIds,
    setCompareId,
    compareSites,
    compareEnabled,
    setCompareEnabled,
    localTime,
    setLocalTime,
    durationDays,
    date,
    dateLabel,
  } = useMission();

  const entries: CompareEntry[] = useMemo(
    () =>
      compareSites
        .slice(0, compareEnabled ? 3 : 2)
        .map((site, index) => {
          const model = buildModel(site, date);
          const sun = sunAt(model, localTime);
          const earth = earthAt(model, localTime);
          return {
            site,
            analysis: cachedAnalysis(site, date),
            sunElev: sun.elev,
            sunAz: sun.az,
            earthElev: earth.elev,
            earthAz: earth.az,
            tone: TONES[index],
            letter: ["A", "B", "C"][index],
          };
        }),
    [compareSites, compareEnabled, localTime, date],
  );

  const highest = useMemo(() => {
    if (entries.length < 2) return null;
    const byElevation = [...entries].sort((a, b) => b.site.elevation - a.site.elevation)[0];
    const bySun = [...entries].sort(
      (a, b) => b.analysis.geometricSunHours - a.analysis.geometricSunHours,
    )[0];
    const byEarth = [...entries].sort(
      (a, b) => b.analysis.earthVisibleHours - a.analysis.earthVisibleHours,
    )[0];
    return { byElevation, bySun, byEarth };
  }, [entries]);

  return (
    <div className="page">
      <PageIntro title="Mission comparison" />
      <Disclaimer />

      <div className="compare-intro">
        <div>
          <p className="eyebrow">
            <span className="eyebrow__mark" aria-hidden="true" />
            SYNCHRONIZED SITE TRADE STUDY
          </p>
          <h2 className="compare-title">Side-by-side · no ranking</h2>
          <p className="compare-copy">
            Date and local time are synchronized across every site so the comparison stays
            meaningful. No composite score is applied.
          </p>
        </div>
        <div className="compare-controls">
          <DateSelect />
          <DurationSelect />
          <button
            type="button"
            className={`btn btn--ghost btn--sm ${compareEnabled ? "is-active" : ""}`}
            onClick={() => setCompareEnabled(!compareEnabled)}
            aria-pressed={compareEnabled}
          >
            {compareEnabled ? "Remove Site C" : "Add Site C"}
            <Icon name={compareEnabled ? "close" : "layers"} size={13} />
          </button>
        </div>
      </div>

      <div className={`compare-sites compare-sites--${entries.length}`}>
        {entries.map((entry, index) => (
          <div key={entry.letter} className={`compare-site compare-site--${entry.tone}`}>
            <div className="compare-site__head">
              <span className="compare-site__letter">{entry.letter}</span>
              <span className="compare-site__role">
                {index === 0 ? "PRIMARY" : index === 1 ? "COMPARISON" : "ADDITIONAL"}
              </span>
              <span className="compare-site__quality">{entry.site.dataQuality.toUpperCase()}</span>
            </div>
            <CompareSelect
              value={compareIds[index]}
              onChange={(id) => setCompareId(index, id)}
              exclude={compareIds.filter((_, i) => i !== index)}
              label={`Site ${entry.letter}`}
            />
            <p className="compare-site__region">{entry.site.region}</p>
          </div>
        ))}
      </div>

      <Panel className="panel--compare panel--tech">
        <PanelHead title="Synchronized Site Comparison" meta={`${dateLabel} · ${hoursToLabel(localTime)} LST · ${durationDays}D WINDOW`}>
          <Badge tone="neutral">SAME TIME, SAME DATE</Badge>
        </PanelHead>
        <PanelBody className="panel-body--compare">
          <div className="compare-table" style={{ "--cols": entries.length } as React.CSSProperties}>
            <div className="compare-table__head">
              <span className="compare-table__label">METRIC</span>
              {entries.map((entry) => (
                <span key={entry.letter} className={`compare-table__site compare-table__site--${entry.tone}`}>
                  <i aria-hidden="true" />
                  {entry.site.name}
                </span>
              ))}
            </div>

            <CompareRow label="SITE ELEVATION" entries={entries}>
              {(entry) => (
                <>
                  +{entry.site.elevation.toLocaleString()} <small>m</small>
                  <span className="compare-cell__hint">±{entry.site.elevationUncertainty} m sample</span>
                </>
              )}
            </CompareRow>

            <CompareRow label="MODELED ILLUMINATION" entries={entries}>
              {(entry) => (
                <>
                  {percentLabel(entry.analysis.geometricSunFraction)}
                  <span className="compare-cell__bar" aria-hidden="true">
                    <span style={{ width: `${entry.analysis.geometricSunFraction * 100}%` }} />
                  </span>
                  <span className="compare-cell__hint">geometric fraction</span>
                </>
              )}
            </CompareRow>

            <CompareRow label={`SUN ELEVATION · ${hoursToLabel(localTime)}`} entries={entries}>
              {(entry) => (
                <>
                  {degreeLabel(entry.sunElev)}
                  <span className="compare-cell__hint">az {azimuthLabel(entry.sunAz)}</span>
                </>
              )}
            </CompareRow>

            <CompareRow label="EARTH ELEVATION" entries={entries}>
              {(entry) => (
                <>
                  {degreeLabel(entry.earthElev)}
                  <span className="compare-cell__hint">
                    {entry.earthElev > 0 ? "geometric visible" : "below horizon"}
                  </span>
                </>
              )}
            </CompareRow>

            <CompareRow label="SUNLIGHT DURATION" entries={entries}>
              {(entry) => (
                <>
                  {durationLabel(entry.analysis.geometricSunHours)}
                  <span className="compare-cell__hint">
                    terrain {durationLabel(entry.analysis.terrainSunHours)}
                  </span>
                </>
              )}
            </CompareRow>

            <CompareRow label="LONGEST DARKNESS PERIOD" entries={entries}>
              {(entry) => (
                <>
                  {durationLabel(entry.analysis.longestDarkness)}
                  <span className="compare-cell__hint">terrain-adjusted</span>
                </>
              )}
            </CompareRow>

            <CompareRow label="EARTH VISIBILITY DURATION" entries={entries}>
              {(entry) => (
                <>
                  {durationLabel(entry.analysis.earthVisibleHours)}
                  <span className="compare-cell__hint">per 24 h</span>
                </>
              )}
            </CompareRow>

            <CompareRow label="LONGEST COMM BLACKOUT" entries={entries}>
              {(entry) => (
                <>
                  {durationLabel(entry.analysis.longestBlackout)}
                  <span className="compare-cell__hint">geometric only</span>
                </>
              )}
            </CompareRow>

            <CompareRow label="TERRAIN / DATA QUALITY" entries={entries}>
              {(entry) => (
                <>
                  {entry.site.category}
                  <span className="compare-cell__hint">{entry.site.dataQuality} dataset</span>
                </>
              )}
            </CompareRow>
          </div>

          <div className="sync-bar">
            <TimeSlider onScrub={setLocalTime} variant="inline" />
            <span className="sync-bar__note">
              <Icon name="clock" size={12} /> TIME SELECTION SYNCHRONIZED ACROSS ALL SITES
            </span>
          </div>
        </PanelBody>
      </Panel>

      <div className="compare-charts">
        <Panel className="panel--chart">
          <PanelHead title="Solar Elevation Profiles" meta="24 HOUR LOCAL SOL · COMPARISON">
            <Legend
              items={entries.map((entry) => ({
                label: entry.site.shortName.toUpperCase(),
                tone: entry.tone,
              }))}
            />
          </PanelHead>
          <PanelBody className="panel-body--chart">
            <PolarSolarProfile
              series={entries.map((entry) => ({
                site: entry.site,
                tone: entry.tone,
                label: entry.site.name,
                dashed: entry.tone === "field",
              }))}
              localTime={localTime}
              date={date}
              onScrub={setLocalTime}
              height={280}
              showField={false}
            />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Earth Visibility Timelines" meta="GEOMETRIC LINE OF SIGHT" />
          <PanelBody>
            {entries.map((entry) => (
              <div key={entry.site.id} className="timeline-row">
                <div className="timeline-row__head">
                  <span className={`timeline-row__name timeline-row__name--${entry.tone}`}>
                    <i aria-hidden="true" />
                    {entry.site.shortName}
                  </span>
                  <span>{durationLabel(entry.analysis.earthVisibleHours)}</span>
                </div>
                <VisibilityTimeline
                  intervals={entry.analysis.earthVisible}
                  localTime={localTime}
                  onScrub={setLocalTime}
                  label={`Earth visibility windows for ${entry.site.name}`}
                />
              </div>
            ))}
            <ScientificNote>
              Timelines are generated from the same astronomy-engine ephemeris model as the
              individual pages. They are illustrative geometry, not contact plans.
            </ScientificNote>
          </PanelBody>
        </Panel>
      </div>

      <div className="compare-bottom">
        <Panel>
          <PanelHead title="Solar Illumination Timelines" meta="TERRAIN-ADJUSTED SHARE" />
          <PanelBody>
            {entries.map((entry) => (
              <div key={entry.site.id} className="timeline-row">
                <div className="timeline-row__head">
                  <span className={`timeline-row__name timeline-row__name--${entry.tone}`}>
                    <i aria-hidden="true" />
                    {entry.site.shortName}
                  </span>
                  <span>{percentLabel(entry.analysis.terrainSunFraction)}</span>
                </div>
                <VisibilityTimeline
                  intervals={entry.analysis.sunTerrain}
                  localTime={localTime}
                  onScrub={setLocalTime}
                  label={`Terrain adjusted sunlight windows for ${entry.site.name}`}
                />
              </div>
            ))}
          </PanelBody>
        </Panel>

        <Panel className="panel--tradeoffs">
          <PanelHead title="Trade-offs" meta="TRANSPARENT CRITERIA">
            <Badge tone="purple">NO AUTOMATIC WINNER</Badge>
          </PanelHead>
          <PanelBody>
            <p className="tradeoffs-copy">
              The values above describe different strengths. Selecting a site requires mission
              weights for power, thermal survival, communications and surface operations — none of
              which are defined in this interface.
            </p>
            <ul className="tradeoffs-list">
              {highest ? (
                <>
                  <li>
                    <span>HIGHEST SAMPLE ELEVATION</span>
                    <strong>
                      {highest.byElevation.site.name} · +{highest.byElevation.site.elevation.toLocaleString()} m
                    </strong>
                  </li>
                  <li>
                    <span>LONGEST MODELED SUNLIGHT</span>
                    <strong>
                      {highest.bySun.site.name} ·{" "}
                      {durationLabel(highest.bySun.analysis.geometricSunHours)}
                    </strong>
                  </li>
                  <li>
                    <span>LONGEST EARTH VISIBILITY</span>
                    <strong>
                      {highest.byEarth.site.name} ·{" "}
                      {durationLabel(highest.byEarth.analysis.earthVisibleHours)}
                    </strong>
                  </li>
                </>
              ) : null}
              <li>
                <span>DATA CONFIDENCE</span>
                <strong>
                  {entries.every((entry) => entry.site.dataQuality === "Sample")
                    ? "All samples are illustrative"
                    : "Artemis III / LOLA DEM candidate profiles"}
                </strong>
              </li>
            </ul>
            <ScientificNote>
              No weighted score, ranking or recommendation is produced. Elevation, illumination and
              visibility figures require validation against authoritative datasets before any
              architecture decision.
            </ScientificNote>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}

function CompareRow({
  label,
  entries,
  children,
}: {
  label: string;
  entries: CompareEntry[];
  children: (entry: CompareEntry) => React.ReactNode;
}) {
  return (
    <div className="compare-table__row">
      <span className="compare-table__label">{label}</span>
      {entries.map((entry) => (
        <span key={entry.letter} className="compare-cell">
          {children(entry)}
        </span>
      ))}
    </div>
  );
}

function CompareSelect({
  value,
  onChange,
  exclude,
  label,
}: {
  value: string;
  onChange: (id: string) => void;
  exclude: string[];
  label: string;
}) {
  return (
    <div className="field field--flush">
      <label className="field__label" htmlFor={`compare-${label}`}>
        {label.toUpperCase()} · LANDING SITE
      </label>
      <div className="field__shell">
        <Icon name="pin" size={13} className="field__icon" />
        <select
          id={`compare-${label}`}
          className="field__select"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {SITES.map((site) => (
            <option key={site.id} value={site.id} disabled={exclude.includes(site.id)}>
              {site.name}
            </option>
          ))}
        </select>
        <Icon name="chevron" size={13} className="field__chevron" />
      </div>
    </div>
  );
}