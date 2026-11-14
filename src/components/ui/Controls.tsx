import { useId } from "react";
import { useMission } from "../../context/MissionContext";
import { MISSION_DATES, SITES } from "../../data/sites";
import { degreeLabel, hoursToLabel } from "../../lib/mission";
import { Icon } from "./Icon";

export function SiteSelect({ compact = false, label = "Landing site" }: { compact?: boolean; label?: string }) {
  const { siteId, setSiteId } = useMission();
  const id = useId();
  return (
    <div className={`field ${compact ? "field--compact" : ""}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="field__shell">
        <Icon name="pin" size={13} className="field__icon" />
        <select
          id={id}
          className="field__select"
          value={siteId}
          onChange={(event) => setSiteId(event.target.value)}
        >
          {SITES.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
        <Icon name="chevron" size={13} className="field__chevron" />
      </div>
    </div>
  );
}

export function DateSelect({ label = "Mission date" }: { label?: string }) {
  const { date, setDate } = useMission();
  const id = useId();
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="field__shell">
        <Icon name="calendar" size={13} className="field__icon" />
        <select
          id={id}
          className="field__select"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        >
          {MISSION_DATES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon name="chevron" size={13} className="field__chevron" />
      </div>
    </div>
  );
}

export function DurationSelect() {
  const { durationDays, setDurationDays, durationOptions } = useMission();
  return (
    <div className="field field--duration">
      <span className="field__label">Mission duration</span>
      <div className="seg seg--compact" role="group" aria-label="Mission duration">
        {durationOptions.map((option) => (
          <button
            key={option}
            type="button"
            className={`seg__btn ${durationDays === option ? "is-active" : ""}`}
            aria-pressed={durationDays === option}
            onClick={() => setDurationDays(option)}
          >
            {option}D
          </button>
        ))}
      </div>
    </div>
  );
}

export function MissionControls({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mission-controls">
      <DateSelect />
      <SiteSelect />
      <DurationSelect />
      {children}
    </div>
  );
}

export function TimeSlider({
  variant = "full",
  label = "Mission local time",
  showTicks = true,
  onScrub,
}: {
  variant?: "full" | "inline";
  label?: string;
  showTicks?: boolean;
  onScrub?: (hour: number) => void;
}) {
  const { localTime, setLocalTime, sun, earth } = useMission();
  const pct = (localTime / 24) * 100;
  const update = (hour: number) => {
    setLocalTime(hour);
    onScrub?.(hour);
  };
  return (
    <div className={`time-slider time-slider--${variant}`}>
      <div className="time-slider__head">
        <span className="time-slider__label">
          <Icon name="clock" size={12} />
          {label}
        </span>
        <span className="time-slider__value">{hoursToLabel(localTime)} LST</span>
      </div>
      <div className="range">
        <input
          type="range"
          min={0}
          max={23.99}
          step={1 / 60}
          value={localTime}
          onChange={(event) => update(Number(event.target.value))}
          aria-label={`${label}: ${hoursToLabel(localTime)} local solar time`}
          style={{ "--range-progress": `${pct}%` } as React.CSSProperties}
        />
        <div className="range__ticks" aria-hidden="true">
          {["00:00", "06:00", "12:00", "18:00", "24:00"].map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
      </div>
      {showTicks ? (
        <div className="time-slider__readout">
          <span>SUN {degreeLabel(sun.elev, 1)}</span>
          <span>EARTH {degreeLabel(earth.elev, 1)}</span>
        </div>
      ) : null}
    </div>
  );
}

export function ActionButton({
  children,
  onClick,
  variant = "ghost",
  href,
  icon = "arrow",
  size,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "quiet";
  href?: string;
  icon?: "arrow" | "pin" | "target" | null;
  size?: "sm" | "md";
}) {
  const className = `btn btn--${variant}${size ? ` btn--${size}` : ""}`;
  const content = (
    <>
      <span>{children}</span>
      {icon ? <Icon name={icon} size={14} /> : null}
    </>
  );
  if (href) {
    return (
      <a className={className} href={href} onClick={onClick}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  );
}
