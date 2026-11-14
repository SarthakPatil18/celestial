export interface DsnTarget {
  name: string;
  rtltSec: number;
  isLunar: boolean;
}

export interface DsnDish {
  name: string;
  complex: "Goldstone" | "Madrid" | "Canberra";
  azimuthDeg: number;
  elevationDeg: number;
  targets: DsnTarget[];
}

export interface DsnSnapshot {
  source: "live-nasa-dsn" | "fallback";
  dishes: DsnDish[];
}

const LUNAR_IDS = new Set([
  "LRO",
  "KPLO",
  "CAPS",
  "CH3",
  "SLIM",
  "IM1",
  "IM2",
  "BGM1",
  "LUNAR",
  "ARTEMIS",
]);

function inferComplex(dishName: string): "Goldstone" | "Madrid" | "Canberra" {
  const num = parseInt(dishName.replace(/\D/g, ""), 10);
  if (num >= 50 && num < 70) return "Madrid";
  if (num >= 30 && num < 50) return "Canberra";
  return "Goldstone";
}

const FALLBACK_SNAPSHOT: DsnSnapshot = {
  source: "fallback",
  dishes: [
    {
      name: "DSS-24",
      complex: "Goldstone",
      azimuthDeg: 224.6,
      elevationDeg: 41.2,
      targets: [{ name: "LRO", rtltSec: 2.56, isLunar: true }],
    },
    {
      name: "DSS-65",
      complex: "Madrid",
      azimuthDeg: 198.3,
      elevationDeg: 34.8,
      targets: [{ name: "KPLO", rtltSec: 2.54, isLunar: true }],
    },
    {
      name: "DSS-36",
      complex: "Canberra",
      azimuthDeg: 312.1,
      elevationDeg: 27.5,
      targets: [{ name: "CAPS", rtltSec: 2.58, isLunar: true }],
    },
  ],
};

export async function fetchLiveDsn(): Promise<DsnSnapshot> {
  try {
    const res = await fetch(`/api/dsn?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return FALLBACK_SNAPSHOT;
    const xmlText = await res.text();
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    if (doc.querySelector("parsererror")) return FALLBACK_SNAPSHOT;

    const dishNodes = Array.from(doc.querySelectorAll("dish"));
    const dishes: DsnDish[] = [];

    for (const node of dishNodes) {
      const name = node.getAttribute("name") || "DSS";
      const azimuthDeg = parseFloat(node.getAttribute("azimuthAngle") || "0");
      const elevationDeg = parseFloat(node.getAttribute("elevationAngle") || "0");
      const targets: DsnTarget[] = Array.from(node.querySelectorAll("target")).map(
        (t) => {
          const tName = (t.getAttribute("name") || "UNKNOWN").toUpperCase();
          const rtltSec = parseFloat(t.getAttribute("rtlt") || "0");
          const isLunar =
            LUNAR_IDS.has(tName) ||
            tName.includes("LRO") ||
            tName.includes("LUNAR") ||
            (rtltSec > 2.1 && rtltSec < 3.0);
          return { name: tName, rtltSec, isLunar };
        }
      );

      if (targets.length > 0) {
        dishes.push({
          name,
          complex: inferComplex(name),
          azimuthDeg,
          elevationDeg,
          targets,
        });
      }
    }

    if (dishes.length === 0) return FALLBACK_SNAPSHOT;

    // Sort lunar-tracking dishes first
    dishes.sort((a, b) => {
      const aL = a.targets.some((t) => t.isLunar) ? 1 : 0;
      const bL = b.targets.some((t) => t.isLunar) ? 1 : 0;
      return bL - aL;
    });

    return { source: "live-nasa-dsn", dishes };
  } catch {
    return FALLBACK_SNAPSHOT;
  }
}