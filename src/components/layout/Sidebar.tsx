import { useEffect, useState } from "react";
import { PAGES, useMission } from "../../context/MissionContext";
import { Icon, LogoMark } from "../ui/Icon";
import { fetchLiveDsn, type DsnSnapshot } from "../../lib/dsn";

const PAGE_ICONS = {
  overview: "overview",
  "landing-sites": "pin",
  "horizon-simulator": "horizon",
  "solar-analysis": "sun",
  "communication-windows": "signal",
  "mission-comparison": "compare",
} as const;

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { page, navigate } = useMission();
  const [dsn, setDsn] = useState<DsnSnapshot | null>(null);

  useEffect(() => {
    let active = true;
    const poll = () =>
      fetchLiveDsn().then((snap) => {
        if (active) setDsn(snap);
      });
    poll();
    const id = window.setInterval(poll, 15000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  const primaryDish =
    dsn?.dishes.find((d) => d.targets.some((t) => t.isLunar)) ?? dsn?.dishes[0];

  return (
    <div className="sidebar__inner">
      <div className="brand">
        <span className="brand__mark">
          <LogoMark size={30} />
        </span>
        <div className="brand__text">
          <span className="brand__name">
            LUNAR<span className="brand__slash">/</span>HORIZON
          </span>
          <span className="brand__sub">SOUTH POLE · EPHEMERIS &amp; DEM</span>
        </div>
      </div>

      <nav className="nav">
        <span className="nav__label">MISSION SYSTEMS</span>
        <div className="nav__list">
          {PAGES.map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav__item ${active ? "is-active" : ""}`}
                onClick={() => {
                  navigate(item.id);
                  onNavigate?.();
                }}
                aria-current={active ? "page" : undefined}
              >
                <span className="nav__icon">
                  <Icon name={PAGE_ICONS[item.id]} size={15} />
                </span>
                <span className="nav__text">{item.label}</span>
                <span className="nav__index">{item.index}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="sidebar__bottom">
        <div className="dsn">
          <div className="dsn__head">
            <Icon name="signal" size={12} />
            <span>DEEP SPACE LINK</span>
          </div>
          <div className="dsn__row">
            <span className="dsn__target">
              {primaryDish
                ? `${primaryDish.name} • ${primaryDish.complex}`
                : "DSN • Goldstone"}
            </span>
            <span className="status status--live">
              <i className="status__dot" aria-hidden="true" />
              {dsn?.source === "live-nasa-dsn" ? "LIVE" : "READY"}
            </span>
          </div>
          <div className="dsn__bars" aria-hidden="true">
            {[32, 58, 44, 82, 66, 94, 74, 50, 38, 28].map((h, i) => (
              <span key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
          <p className="dsn__note">
            {primaryDish?.targets[0]
              ? `Tracking ${primaryDish.targets[0].name} · El ${primaryDish.elevationDeg.toFixed(1)}°`
              : "NASA JPL DSN Now feed"}
          </p>
        </div>

        <div className="sidebar__foot">
          <span>JPL DE440 · LOLA DEM</span>
          <span>ARTEMIS III</span>
        </div>
      </div>
    </div>
  );
}