import { PAGES, useClock, useMission } from "../../context/MissionContext";
import { Icon } from "../ui/Icon";

function formatUtc(date: Date) {
  const day = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  const time = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  return { day, time };
}

export function Header({ onMenu }: { onMenu: () => void }) {
  const { page, theme, toggleTheme } = useMission();
  const now = useClock();
  const { day, time } = formatUtc(now);
  const label = PAGES.find((p) => p.id === page)?.label ?? "Overview";

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          type="button"
          className="icon-btn topbar__menu"
          onClick={onMenu}
          aria-label="Open navigation"
        >
          <Icon name="menu" size={18} />
        </button>
        <div className="crumbs" aria-label="Breadcrumb">
          <span className="crumb">MISSION CONTROL</span>
          <span className="crumb__sep" aria-hidden="true">
            /
          </span>
          <span className="crumb crumb--current">{label}</span>
        </div>
      </div>

      <div className="topbar__right">
        <div className="utc">
          <span className="utc__label">EARTH UTC</span>
          <span className="utc__date">{day}</span>
          <span className="utc__time">{time}</span>
        </div>
        <span className="sysstatus">
          <i className="status__dot" aria-hidden="true" />
          ALL SYSTEMS NOMINAL
        </span>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          <Icon name={theme === "dark" ? "sunny" : "moon"} size={15} />
          <span>{theme === "dark" ? "LIGHT" : "DARK"}</span>
        </button>
      </div>
    </header>
  );
}
