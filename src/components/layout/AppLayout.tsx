import { useState } from "react";
import { Outlet, useLocation, useMatches, useNavigate, useNavigationType } from "react-router-dom";
import { business } from "../../config";
import { MAX_STEP, PATHS, type RouteHandle } from "../../router/paths";
import { ToastProvider } from "../../context/ToastContext";
import { BackIcon } from "../ui/Icons";

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const navType = useNavigationType();
  const matches = useMatches();
  const [scrolled, setScrolled] = useState(false);

  const step = (matches.at(-1)?.handle as RouteHandle | undefined)?.step ?? 0;
  const canGoBack = location.pathname !== PATHS.start && location.key !== "default";

  return (
    <div className="stage">
      <div className="protolabel">{business.brand} · Sede {business.branch.name}</div>
      <div className="device">
        <ToastProvider>
          <header className={`nav${scrolled ? " scrolled" : ""}`}>
            <button className={`back${canGoBack ? " on" : ""}`} aria-label="Atrás" onClick={() => navigate(-1)}>
              <BackIcon />
            </button>
            <div className="navtitle">{business.brand}</div>
            <div className="navspacer" />
          </header>
          <div className="progress">
            <i style={{ width: `${(step / MAX_STEP) * 100}%` }} />
          </div>
          <main className="screens">
            <section
              key={location.pathname}
              className={`screen active${navType === "POP" ? " back-anim" : ""}`}
              onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 6)}
            >
              <Outlet />
            </section>
          </main>
        </ToastProvider>
      </div>
    </div>
  );
}
