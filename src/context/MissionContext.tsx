import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SITE_ID,
  DURATION_OPTIONS,
  MISSION_DATES,
  SITES,
  ANCHOR_HOUR,
  getSite,
  type Site,
} from "../data/sites";
import {
  buildModel,
  cachedAnalysis,
  sunAt,
  earthAt,
  type SiteAnalysis,
  type SiteModel,
} from "../lib/mission";

export type Theme = "dark" | "light";
export type PageId =
  | "overview"
  | "landing-sites"
  | "horizon-simulator"
  | "solar-analysis"
  | "communication-windows"
  | "mission-comparison";

export const PAGES: { id: PageId; label: string; index: string }[] = [
  { id: "overview", label: "Overview", index: "01" },
  { id: "landing-sites", label: "Landing Sites", index: "02" },
  { id: "horizon-simulator", label: "Horizon Simulator", index: "03" },
  { id: "solar-analysis", label: "Solar Analysis", index: "04" },
  { id: "communication-windows", label: "Communication Windows", index: "05" },
  { id: "mission-comparison", label: "Mission Comparison", index: "06" },
];

interface MissionState {
  siteId: string;
  site: Site;
  setSiteId: (id: string) => void;
  date: string;
  setDate: (date: string) => void;
  dateLabel: string;
  durationDays: number;
  setDurationDays: (days: number) => void;
  durationOptions: readonly number[];
  localTime: number;
  setLocalTime: (hour: number) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  page: PageId;
  navigate: (page: PageId) => void;
  model: SiteModel;
  analysis: SiteAnalysis;
  sun: ReturnType<typeof sunAt>;
  earth: ReturnType<typeof earthAt>;
  compareIds: string[];
  setCompareId: (index: number, id: string) => void;
  compareSites: Site[];
  compareEnabled: boolean;
  setCompareEnabled: (enabled: boolean) => void;
  demo: boolean;
}

const MissionContext = createContext<MissionState | null>(null);

const THEME_KEY = "lunar-horizon-theme";

function readTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
}

function readPage(): PageId {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return (PAGES.find((p) => p.id === hash)?.id ?? "overview") as PageId;
}

export function MissionProvider({ children }: { children: ReactNode }) {
  const [siteId, setSiteId] = useState(DEFAULT_SITE_ID);
  const [date, setDate] = useState(MISSION_DATES[0].value);
  const [durationDays, setDurationDays] = useState<number>(DURATION_OPTIONS[1]);
  const [localTime, setLocalTime] = useState(ANCHOR_HOUR);
  const [theme, setThemeState] = useState<Theme>(readTheme);
  const [page, setPage] = useState<PageId>(readPage);
  const [compareIds, setCompareIds] = useState<string[]>(["haworth", "degerlache", "nobile"]);
  const [compareEnabled, setCompareEnabled] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const onHash = () => setPage(readPage());
    window.addEventListener("hashchange", onHash);
    if (!window.location.hash) window.history.replaceState(null, "", "#/overview");
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [page]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);
  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    [],
  );

  const navigate = useCallback((next: PageId) => {
    window.location.hash = `#/${next}`;
    setPage(next);
  }, []);

  const setCompareId = useCallback((index: number, id: string) => {
    setCompareIds((prev) => {
      const next = [...prev];
      next[index] = id;
      return next;
    });
  }, []);

  const site = useMemo(() => getSite(siteId), [siteId]);
  const model = useMemo(() => buildModel(site), [site]);
  const analysis = useMemo(() => cachedAnalysis(site), [site]);
  const compareSites = useMemo(() => compareIds.map(getSite), [compareIds]);
  const dateLabel = MISSION_DATES.find((d) => d.value === date)?.label ?? date;
  const sun = useMemo(() => sunAt(model, localTime), [model, localTime]);
  const earth = useMemo(() => earthAt(model, localTime), [model, localTime]);

  const value: MissionState = {
    siteId,
    site,
    setSiteId,
    date,
    setDate,
    dateLabel,
    durationDays,
    setDurationDays,
    durationOptions: DURATION_OPTIONS,
    localTime,
    setLocalTime,
    theme,
    setTheme,
    toggleTheme,
    page,
    navigate,
    model,
    analysis,
    sun,
    earth,
    compareIds,
    setCompareId,
    compareSites,
    compareEnabled,
    setCompareEnabled,
    demo: true,
  };

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
}

export function useMission(): MissionState {
  const ctx = useContext(MissionContext);
  if (!ctx) throw new Error("useMission must be used inside MissionProvider");
  return ctx;
}

export function useClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export { SITES };
