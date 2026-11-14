export type TerrainKind = "highlands" | "rim" | "massif" | "ridge";

export interface SiteProfile {
  /** Midpoint of the schematic 24-hour local-sol elevation curve, degrees. */
  mean: number;
  /** Half-amplitude of the schematic elevation curve, degrees. */
  amp: number;
  /** Elevation at the anchor time (16:50 LST), used to fit the curve. */
  anchor: number;
  /** Azimuth clockwise from north at anchor time, degrees. */
  anchorAz: number;
  /** Terrain obstruction used for terrain-adjusted sunlight windows. */
  terrainHorizon: number;
}

export interface Site {
  id: string;
  name: string;
  shortName: string;
  region: string;
  category: string;
  terrain: TerrainKind;
  lat: number;
  lon: number;
  elevation: number;
  elevationUncertainty: number;
  sun: SiteProfile;
  earth: {
    mean: number;
    amp: number;
    anchor: number;
    anchorAz: number;
    horizon: number;
  };
  /** Relative site index 0–1 driving the illustrative relief drawing. */
  relief: number;
  atlas: { x: number; y: number };
  dataQuality: "Sample" | "Limited sample";
  note: string;
}

/** Anchor local time used by the reference capture: 16:50 LST. */
export const ANCHOR_HOUR = 16 + 50 / 60;

export const SITES: Site[] = [
  {
    id: "haworth",
    name: "Haworth Plateau",
    shortName: "Haworth",
    region: "Haworth • highlands",
    category: "Highland plateau",
    terrain: "highlands",
    lat: -87.54,
    lon: 203.2,
    elevation: 685,
    elevationUncertainty: 45,
    sun: { mean: 3.5, amp: 7.0, anchor: -3.1, anchorAz: 115, terrainHorizon: 2.2 },
    earth: { mean: 2.0, amp: 11.0, anchor: 12.0, anchorAz: 226, horizon: 0 },
    relief: 0.62,
    atlas: { x: 0.46, y: 0.44 },
    dataQuality: "Sample",
    note: "Highland plateau sample selected for continuous south-polar terrain.",
  },
  {
    id: "nobile",
    name: "Nobile Rim 01",
    shortName: "Nobile Rim",
    region: "Nobile • rim",
    category: "Crater rim",
    terrain: "rim",
    lat: -85.44,
    lon: 42.1,
    elevation: 340,
    elevationUncertainty: 70,
    sun: { mean: 2.8, amp: 8.4, anchor: -5.6, anchorAz: 108, terrainHorizon: 3.1 },
    earth: { mean: 1.5, amp: 13.0, anchor: 9.0, anchorAz: 214, horizon: 0 },
    relief: 0.44,
    atlas: { x: 0.63, y: 0.27 },
    dataQuality: "Limited sample",
    note: "Rim sample with a modelled terrain obstruction toward the sun track.",
  },
  {
    id: "degerlache",
    name: "De Gerlache Rim",
    shortName: "De Gerlache",
    region: "De Gerlache • near side",
    category: "Crater rim",
    terrain: "rim",
    lat: -88.5,
    lon: 272.9,
    elevation: 410,
    elevationUncertainty: 60,
    sun: { mean: 4.1, amp: 6.2, anchor: -1.3, anchorAz: 121, terrainHorizon: 2.8 },
    earth: { mean: 5.0, amp: 9.0, anchor: 7.4, anchorAz: 233, horizon: 0 },
    relief: 0.5,
    atlas: { x: 0.3, y: 0.6 },
    dataQuality: "Sample",
    note: "Near-side rim sample with higher modelled Earth elevation.",
  },
  {
    id: "malapert",
    name: "Malapert Massif",
    shortName: "Malapert",
    region: "Malapert • massif",
    category: "Massif",
    terrain: "massif",
    lat: -86.0,
    lon: 2.7,
    elevation: 4900,
    elevationUncertainty: 180,
    sun: { mean: 6.0, amp: 6.5, anchor: 3.4, anchorAz: 132, terrainHorizon: 1.2 },
    earth: { mean: 8.0, amp: 10.0, anchor: 15.2, anchorAz: 241, horizon: 0 },
    relief: 0.86,
    atlas: { x: 0.68, y: 0.67 },
    dataQuality: "Limited sample",
    note: "High-standing sample; elevation is a coarse illustrative value.",
  },
  {
    id: "connecting",
    name: "Connecting Ridge",
    shortName: "Connecting Ridge",
    region: "Connecting Ridge • ridge",
    category: "Ridge",
    terrain: "ridge",
    lat: -89.45,
    lon: 122.0,
    elevation: 1200,
    elevationUncertainty: 90,
    sun: { mean: 5.2, amp: 5.4, anchor: 1.2, anchorAz: 99, terrainHorizon: 1.8 },
    earth: { mean: 4.0, amp: 12.0, anchor: 8.6, anchorAz: 205, horizon: 0 },
    relief: 0.7,
    atlas: { x: 0.52, y: 0.3 },
    dataQuality: "Sample",
    note: "Ridge sample with a long modelled illumination fraction.",
  },
  {
    id: "shackleton",
    name: "Shackleton Rim",
    shortName: "Shackleton",
    region: "Shackleton • rim",
    category: "Crater rim",
    terrain: "rim",
    lat: -89.66,
    lon: 129.2,
    elevation: 1400,
    elevationUncertainty: 110,
    sun: { mean: 2.2, amp: 8.8, anchor: -6.2, anchorAz: 112, terrainHorizon: 3.4 },
    earth: { mean: 1.0, amp: 14.0, anchor: 5.1, anchorAz: 220, horizon: 0 },
    relief: 0.56,
    atlas: { x: 0.42, y: 0.63 },
    dataQuality: "Limited sample",
    note: "Polar rim sample; long modelled shadow intervals in this schematic.",
  },
];

export const DEFAULT_SITE_ID = "haworth";

export function getSite(id: string): Site {
  return SITES.find((s) => s.id === id) ?? SITES[0];
}

export const MISSION_DATES = [
  { value: "2026-10-03", label: "03 OCT 2026" },
  { value: "2026-10-06", label: "06 OCT 2026" },
  { value: "2026-10-09", label: "09 OCT 2026" },
  { value: "2026-10-12", label: "12 OCT 2026" },
];

export const DURATION_OPTIONS = [3, 7, 14] as const;
