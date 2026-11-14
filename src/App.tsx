import { useEffect, useState } from "react";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { MissionProvider, useMission } from "./context/MissionContext";
import { CommunicationWindowsPage } from "./pages/CommunicationWindows";
import { HorizonSimulatorPage } from "./pages/HorizonSimulator";
import { LandingSitesPage } from "./pages/LandingSites";
import { MissionComparisonPage } from "./pages/MissionComparison";
import { OverviewPage } from "./pages/Overview";
import { SolarAnalysisPage } from "./pages/SolarAnalysis";

const PAGE_COMPONENTS = {
  overview: OverviewPage,
  "landing-sites": LandingSitesPage,
  "horizon-simulator": HorizonSimulatorPage,
  "solar-analysis": SolarAnalysisPage,
  "communication-windows": CommunicationWindowsPage,
  "mission-comparison": MissionComparisonPage,
} as const;

function Shell() {
  const { page } = useMission();
  const [menuOpen, setMenuOpen] = useState(false);
  const Page = PAGE_COMPONENTS[page] ?? OverviewPage;

  useEffect(() => {
    setMenuOpen(false);
  }, [page]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Skip to mission content
      </a>

      {menuOpen ? (
        <div
          className="scrim"
          role="presentation"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <aside className={`sidebar ${menuOpen ? "is-open" : ""}`} aria-label="Mission navigation">
        <Sidebar onNavigate={() => setMenuOpen(false)} />
      </aside>

      <div className="main">
        <Header onMenu={() => setMenuOpen((open) => !open)} />
        <main id="main-content" tabIndex={-1}>
          <Page key={page} />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <MissionProvider>
      <Shell />
    </MissionProvider>
  );
}
