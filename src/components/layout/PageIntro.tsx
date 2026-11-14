import type { ReactNode } from "react";
import { Icon } from "../ui/Icon";
import { MissionControls } from "../ui/Controls";

export function PageIntro({
  eyebrow = "MISSION SYSTEMS / LIVE TELEMETRY",
  title,
  aside,
  children,
}: {
  eyebrow?: string;
  title: string;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="page-intro">
      <div className="page-intro__row">
        <div className="page-intro__titles">
          <p className="eyebrow">
            <span className="eyebrow__mark" aria-hidden="true" />
            {eyebrow}
          </p>
          <h1 className="page-title">{title}</h1>
        </div>
        <div className="page-intro__actions">{aside ?? <MissionControls />}</div>
      </div>
      {children}
    </div>
  );
}

export function Disclaimer() {
  return (
    <div className="disclaimer" role="note">
      <span className="disclaimer__badge">
        <Icon name="alert" size={13} />
        ILLUSTRATIVE SAMPLE ESTIMATES
      </span>
      <p>
        Visibility and illumination are schematic only; they are not validated ephemeris, elevation
        models or operational link predictions.
      </p>
    </div>
  );
}

export function SectionHead({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        <p className="eyebrow eyebrow--dim">{kicker}</p>
        <h2 className="section-title">{title}</h2>
      </div>
      {children ? <div className="section-head__aside">{children}</div> : null}
    </div>
  );
}
