import { PAGES, useMission } from "../../context/MissionContext";
import { Icon, LogoMark } from "../ui/Icon";

const NAV_ICONS = {
  overview: "overview",
  "landing-sites": "pin",
  "horizon-simulator": "horizon",
  "solar-analysis": "sun",
  "communication-windows": "signal",
  "mission-comparison": "compare",
} as const;

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { page, navigate, durationDays } = useMission();

  return (
    <div className="sidebar__inner">
      <a
        className="brand"
        href="#/overview"
        onClick={(event) => {
          event.preventDefault();
          navigate("overview");
          onNavigate?.();
        }}
      >
        <span className="brand__mark">
          <LogoMark size={34} />
        </span>
        <span className="brand__text">
          <span className="brand__name">
            LUNAR <span className="brand__slash">/</span> HORIZON
          </span>
          <span className="brand__sub">MISSION INTELLIGENCE</span>
        </span>
      </a>

      <div className="telemetry">
        <div className="telemetry__head">
          <span className="telemetry__title">MISSION TELEMETRY</span>
          <span className="status status--live">
            <i className="status__dot" aria-hidden="true" />
            NOMINAL
          </span>
        </div>
        <div className="telemetry__row">
          <span className="telemetry__label">FLIGHT DAY</span>
          <span className="telemetry__value">SIM • 04</span>
        </div>
        <div className="telemetry__meter" aria-hidden="true">
          <span style={{ width: `${Math.min(100, (4 / Math.max(durationDays, 4)) * 100)}%` }} />
        </div>
        <div className="telemetry__foot">
          <span>DURATION</span>
          <span>{durationDays} DAYS</span>
        </div>
      </div>

      <nav className="nav" aria-label="Primary">
        <p className="nav__label">MISSION SYSTEMS</p>
        <ul className="nav__list">
          {PAGES.map((item) => {
            const active = item.id === page;
            return (
              <li key={item.id}>
                <a
                  href={`#/${item.id}`}
                  className={`nav__item ${active ? "is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    navigate(item.id);
                    onNavigate?.();
                  }}
                >
                  <span className="nav__icon">
                    <Icon name={NAV_ICONS[item.id]} size={15} />
                  </span>
                  <span className="nav__text">{item.label}</span>
                  <span className="nav__index">{item.index}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar__bottom">
        <div className="dsn">
          <div className="dsn__head">
            <Icon name="signal" size={12} />
            <span>DEEP SPACE LINK</span>
          </div>
          <div className="dsn__row">
            <span className="dsn__target">DSN • Goldstone</span>
            <span className="status status--live">
              <i className="status__dot" aria-hidden="true" />
              READY
            </span>
          </div>
          <div className="dsn__bars" aria-hidden="true">
            {[32, 58, 44, 82, 66, 94, 74, 50, 38, 28].map((h, i) => (
              <span key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
          <p className="dsn__note">Concept interface · no operational link</p>
        </div>

        <div className="sidebar__foot">
          <span>HORIZON SIM V.01</span>
          <span>EST 2026</span>
        </div>
        <p className="sidebar__disclaimer">
          Illustrative concept. Not for flight navigation or operational planning.
        </p>
      </div>
    </div>
  );
}
