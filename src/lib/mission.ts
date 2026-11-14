import { ANCHOR_HOUR, type Site, type SiteProfile } from "../data/sites";

export interface Sample {
  hour: number;
  elev: number;
  az: number;
}

const TAU = Math.PI * 2;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Fit a smooth 24-hour local-sol curve through a single anchor elevation.
 *
 * The reference capture shows one elevation at 16:50 LST, so the curve is a
 * schematic sinusoid constrained to pass exactly through that value. This is a
 * visual model, not an ephemeris — every surface that consumes it must label it
 * as illustrative.
 */
function fitZero(profile: Pick<SiteProfile, "mean" | "amp" | "anchor">): number {
  const ratio = clamp((profile.anchor - profile.mean) / profile.amp, -1, 1);
  // Descending branch, so the anchor sits after the modelled peak.
  const theta = Math.PI - Math.asin(ratio);
  return ANCHOR_HOUR - (theta * 24) / TAU;
}

export interface SiteModel {
  site: Site;
  sunZero: number;
  earthZero: number;
}

export function buildModel(site: Site): SiteModel {
  return {
    site,
    sunZero: fitZero(site.sun),
    earthZero: fitZero(site.earth),
  };
}

function elevationAt(hour: number, zero: number, mean: number, amp: number): number {
  return mean + amp * Math.sin((TAU * (hour - zero)) / 24);
}

export function sunAt(model: SiteModel, hour: number): Sample {
  const { sun } = model.site;
  return {
    hour,
    elev: elevationAt(hour, model.sunZero, sun.mean, sun.amp),
    az: ((hour / 24) * 360 + (sun.anchorAz - (ANCHOR_HOUR / 24) * 360) + 360) % 360,
  };
}

export function earthAt(model: SiteModel, hour: number): Sample {
  const { earth } = model.site;
  return {
    hour,
    elev: elevationAt(hour, model.earthZero, earth.mean, earth.amp),
    az: ((hour / 24) * 360 + (earth.anchorAz - (ANCHOR_HOUR / 24) * 360) + 360) % 360,
  };
}

export function sunPath(model: SiteModel, stepMinutes = 10): Sample[] {
  const out: Sample[] = [];
  for (let m = 0; m <= 24 * 60; m += stepMinutes) out.push(sunAt(model, m / 60));
  return out;
}

export function earthPath(model: SiteModel, stepMinutes = 10): Sample[] {
  const out: Sample[] = [];
  for (let m = 0; m <= 24 * 60; m += stepMinutes) out.push(earthAt(model, m / 60));
  return out;
}

export interface Interval {
  start: number;
  end: number;
}

/** Merge minute-sampled predicate crossings into contiguous intervals. */
function intervalsWhere(predicate: (hour: number) => boolean): Interval[] {
  const step = 1 / 60;
  const out: Interval[] = [];
  let open: number | null = null;
  for (let m = 0; m <= 24 * 60; m++) {
    const hour = m / 60;
    const on = predicate(hour);
    if (on && open === null) open = hour;
    if (!on && open !== null) {
      out.push({ start: open, end: hour - step });
      open = null;
    }
  }
  if (open !== null) out.push({ start: open, end: 24 });
  return out;
}

export function totalHours(intervals: Interval[]): number {
  return intervals.reduce((sum, i) => sum + (i.end - i.start), 0);
}

export function longestInterval(intervals: Interval[]): number {
  return intervals.reduce((max, i) => Math.max(max, i.end - i.start), 0);
}

/** Gaps between above-horizon intervals, including the wrap-around night. */
export function gapsBetween(intervals: Interval[]): Interval[] {
  if (intervals.length === 0) return [{ start: 0, end: 24 }];
  const gaps: Interval[] = [];
  for (let i = 0; i < intervals.length - 1; i++) {
    gaps.push({ start: intervals[i].end, end: intervals[i + 1].start });
  }
  const wrap = 24 - intervals[intervals.length - 1].end + intervals[0].start;
  if (wrap > 0) gaps.push({ start: intervals[intervals.length - 1].end, end: 24 + intervals[0].start });
  return gaps;
}

export interface SiteAnalysis {
  sunGeometric: Interval[];
  sunTerrain: Interval[];
  earthVisible: Interval[];
  geometricSunHours: number;
  geometricSunFraction: number;
  terrainSunHours: number;
  terrainSunFraction: number;
  earthVisibleHours: number;
  earthVisibleFraction: number;
  longestDarkness: number;
  longestBlackout: number;
  sunrise: number | null;
  sunset: number | null;
  terrainSunrise: number | null;
  terrainSunset: number | null;
}

export function analyseSite(site: Site): SiteAnalysis {
  const model = buildModel(site);
  const sunGeometric = intervalsWhere((h) => sunAt(model, h).elev > 0);
  const sunTerrain = intervalsWhere((h) => sunAt(model, h).elev > site.sun.terrainHorizon);
  const earthVisible = intervalsWhere((h) => earthAt(model, h).elev > site.earth.horizon);
  const geometricSunHours = totalHours(sunGeometric);
  const terrainSunHours = totalHours(sunTerrain);
  const earthVisibleHours = totalHours(earthVisible);

  return {
    sunGeometric,
    sunTerrain,
    earthVisible,
    geometricSunHours,
    geometricSunFraction: geometricSunHours / 24,
    terrainSunHours,
    terrainSunFraction: terrainSunHours / 24,
    earthVisibleHours,
    earthVisibleFraction: earthVisibleHours / 24,
    longestDarkness: longestInterval(gapsBetween(sunTerrain)),
    longestBlackout: longestInterval(gapsBetween(earthVisible)),
    sunrise: sunGeometric.length ? sunGeometric[0].start : null,
    sunset: sunGeometric.length ? sunGeometric[sunGeometric.length - 1].end : null,
    terrainSunrise: sunTerrain.length ? sunTerrain[0].start : null,
    terrainSunset: sunTerrain.length ? sunTerrain[sunTerrain.length - 1].end : null,
  };
}

const analysisCache = new Map<string, SiteAnalysis>();
export function cachedAnalysis(site: Site): SiteAnalysis {
  const hit = analysisCache.get(site.id);
  if (hit) return hit;
  const next = analyseSite(site);
  analysisCache.set(site.id, next);
  return next;
}

/** Chart domain that always includes the reference ±labels and the data. */
export function elevationDomain(values: number[]): { min: number; max: number } {
  const lo = Math.min(0, ...values);
  const hi = Math.max(0, ...values);
  return {
    min: Math.floor((lo - 1) / 6) * 6,
    max: Math.ceil((hi + 1) / 6) * 6,
  };
}

export function hoursToLabel(hour: number): string {
  if (!Number.isFinite(hour) || hour < 0) return "—";
  const wrapped = ((hour % 24) + 24) % 24;
  const h = Math.floor(wrapped);
  const m = Math.round((wrapped - h) * 60);
  const hh = m === 60 ? (h + 1) % 24 : h;
  const mm = m === 60 ? 0 : m;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function durationLabel(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 60) return `${h + 1}h 00m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function degreeLabel(value: number, digits = 1): string {
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${Math.abs(value).toFixed(digits)}°`;
}

export function azimuthLabel(value: number): string {
  return `${String(Math.round(value) % 360).padStart(3, "0")}°`;
}

export function percentLabel(fraction: number, digits = 0): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}
