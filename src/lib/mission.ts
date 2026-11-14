import * as Astronomy from "astronomy-engine";
import { ANCHOR_HOUR, type Site } from "../data/sites";

export interface Sample {
  hour: number;
  elev: number;
  az: number;
}

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const SYNODIC_DAYS = 29.530588853; // 1 Lunar Sol in Earth days

/**
 * Convert a 0–24h Local Solar Time (LST) slider value into a real UTC Date
 * anchored to the mission date (default 2026-10-03) so the 24h cycle spans
 * one full lunar day (29.53 Earth days) around that epoch.
 */
function hourToMissionDate(hour: number, missionDateISO = "2026-10-03"): Date {
  const baseMs = Date.parse(`${missionDateISO}T16:50:00Z`);
  const deltaHours = hour - ANCHOR_HOUR;
  const deltaMs = (deltaHours / 24) * SYNODIC_DAYS * 86400 * 1000;
  return new Date(baseMs + deltaMs);
}

/**
 * Compute real selenocentric Sun and Earth elevation & azimuth at a Lunar
 * South Pole site using astronomy-engine ephemeris vectors.
 */
function computeRealEphemeris(
  site: Site,
  hour: number,
  missionDateISO?: string
): {
  sun: Sample;
  earth: Sample;
} {
  const date = hourToMissionDate(hour, missionDateISO);

  // Real geocentric vectors from astronomy-engine
  const moonGeo = Astronomy.GeoVector(Astronomy.Body.Moon, date, true);
  const sunGeo = Astronomy.GeoVector(Astronomy.Body.Sun, date, true);

  // Vector from Moon center to Sun
  const sx = sunGeo.x - moonGeo.x;
  const sy = sunGeo.y - moonGeo.y;
  const sz = sunGeo.z - moonGeo.z;
  const sDist = Math.hypot(sx, sy, sz);

  // Sub-solar latitude (ecliptic/equatorial inclination offset ~1.54° relative to lunar equator)
  const sunDecRad = Math.asin(sz / sDist) * 0.065;
  const phaseDeg = Astronomy.MoonPhase(date);

  // Solar azimuth clockwise from North at the Lunar South Pole
  const sunAz = (phaseDeg + site.lon + 360) % 360;
  const latRad = site.lat * DEG2RAD;
  const sunHourRad = sunAz * DEG2RAD;

  const sinSunAlt =
    Math.sin(latRad) * Math.sin(sunDecRad) +
    Math.cos(latRad) * Math.cos(sunDecRad) * Math.cos(sunHourRad);
  const sunElev = Math.asin(Math.max(-1, Math.min(1, sinSunAlt))) * RAD2DEG;

  // Earth position in lunar sky (Earth librates ±6.68° in latitude and ±7.9° in longitude)
  const libration = Astronomy.Libration(date);
  const earthLatRad = (libration.elat || 0) * DEG2RAD;
  const earthLonOffset = libration.elon || 0;
  const earthAz = (360 - site.lon + earthLonOffset + 360) % 360;
  const earthHourRad = earthAz * DEG2RAD;

  const sinEarthAlt =
    Math.sin(latRad) * Math.sin(earthLatRad) +
    Math.cos(latRad) * Math.cos(earthLatRad) * Math.cos(earthHourRad);
  const earthElev = Math.asin(Math.max(-1, Math.min(1, sinEarthAlt))) * RAD2DEG;

  return {
    sun: {
      hour,
      elev: Number(sunElev.toFixed(3)),
      az: Number(sunAz.toFixed(2)),
    },
    earth: {
      hour,
      elev: Number(earthElev.toFixed(3)),
      az: Number(earthAz.toFixed(2)),
    },
  };
}

export interface SiteModel {
  site: Site;
  missionDate?: string;
}

export function buildModel(site: Site, missionDate = "2026-10-03"): SiteModel {
  return { site, missionDate };
}

export function sunAt(model: SiteModel, hour: number): Sample {
  return computeRealEphemeris(model.site, hour, model.missionDate).sun;
}

export function earthAt(model: SiteModel, hour: number): Sample {
  return computeRealEphemeris(model.site, hour, model.missionDate).earth;
}

export function sunPath(model: SiteModel, stepMinutes = 10): Sample[] {
  const out: Sample[] = [];
  for (let m = 0; m <= 24 * 60; m += stepMinutes) {
    out.push(sunAt(model, m / 60));
  }
  return out;
}

export function earthPath(model: SiteModel, stepMinutes = 10): Sample[] {
  const out: Sample[] = [];
  for (let m = 0; m <= 24 * 60; m += stepMinutes) {
    out.push(earthAt(model, m / 60));
  }
  return out;
}

/**
 * Look up directional LOLA DEM horizon elevation angle for a given azimuth.
 * Falls back to the site's scalar terrainHorizon if 360° profile isn't loaded yet.
 */
export function horizonAtAzimuth(site: Site, az: number): number {
  const profile = (site.sun as Site["sun"] & { lolaHorizon36?: number[] })
    .lolaHorizon36;
  if (profile && profile.length === 36) {
    const idx = Math.floor((((az % 360) + 360) % 360) / 10);
    return profile[idx];
  }
  return site.sun.terrainHorizon;
}

export interface Interval {
  start: number;
  end: number;
}

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

export function gapsBetween(intervals: Interval[]): Interval[] {
  if (intervals.length === 0) return [{ start: 0, end: 24 }];
  const gaps: Interval[] = [];
  for (let i = 0; i < intervals.length - 1; i++) {
    gaps.push({ start: intervals[i].end, end: intervals[i + 1].start });
  }
  const wrap = 24 - intervals[intervals.length - 1].end + intervals[0].start;
  if (wrap > 0) {
    gaps.push({
      start: intervals[intervals.length - 1].end,
      end: 24 + intervals[0].start,
    });
  }
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

export function analyseSite(
  site: Site,
  missionDate = "2026-10-03"
): SiteAnalysis {
  const model = buildModel(site, missionDate);
  const sunGeometric = intervalsWhere((h) => sunAt(model, h).elev > 0);
  const sunTerrain = intervalsWhere((h) => {
    const s = sunAt(model, h);
    return s.elev > horizonAtAzimuth(site, s.az);
  });
  const earthVisible = intervalsWhere(
    (h) => earthAt(model, h).elev > site.earth.horizon
  );
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
    sunset: sunGeometric.length
      ? sunGeometric[sunGeometric.length - 1].end
      : null,
    terrainSunrise: sunTerrain.length ? sunTerrain[0].start : null,
    terrainSunset: sunTerrain.length
      ? sunTerrain[sunTerrain.length - 1].end
      : null,
  };
}

const analysisCache = new Map<string, SiteAnalysis>();

export function cachedAnalysis(
  site: Site,
  missionDate = "2026-10-03"
): SiteAnalysis {
  const key = `${site.id}:${missionDate}`;
  const hit = analysisCache.get(key);
  if (hit) return hit;
  const next = analyseSite(site, missionDate);
  analysisCache.set(key, next);
  return next;
}

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