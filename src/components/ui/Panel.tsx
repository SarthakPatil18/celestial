import type { ReactNode } from "react";

export function Panel({
  children,
  className = "",
  as: Tag = "section",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article" | "aside";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={`panel ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function PanelHead({
  title,
  meta,
  children,
  className = "",
}: {
  title: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`panel-head ${className}`}>
      <div className="panel-head__main">
        <h2 className="panel-title">{title}</h2>
        {meta ? <p className="panel-meta">{meta}</p> : null}
      </div>
      {children ? <div className="panel-head__aside">{children}</div> : null}
    </div>
  );
}

export function PanelBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`panel-body ${className}`}>{children}</div>;
}

export function Kicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`kicker ${className}`}>{children}</p>;
}

export function Badge({
  children,
  tone = "neutral",
  dot = false,
}: {
  children: ReactNode;
  tone?: "neutral" | "cyan" | "amber" | "purple" | "green";
  dot?: boolean;
}) {
  return (
    <span className={`badge badge--${tone}`}>
      {dot ? <span className="badge__dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export function DataRow({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "cyan" | "amber" | "purple";
}) {
  return (
    <div className="data-row">
      <div className="data-row__label">{label}</div>
      <div className={`data-row__value data-row__value--${tone}`}>{value}</div>
      {hint ? <div className="data-row__hint">{hint}</div> : null}
    </div>
  );
}

export function Legend({
  items,
}: {
  items: { label: string; tone: "sun" | "earth" | "field" | "muted"; dashed?: boolean }[];
}) {
  return (
    <ul className="legend">
      {items.map((item) => (
        <li key={item.label} className="legend__item">
          <span
            className={`legend__swatch legend__swatch--${item.tone}${item.dashed ? " legend__swatch--dashed" : ""}`}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function ScientificNote({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`scientific-note ${className}`}>
      <span className="scientific-note__mark" aria-hidden="true">
        i
      </span>
      <span>{children}</span>
    </p>
  );
}
