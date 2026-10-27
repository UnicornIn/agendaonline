import { useState } from "react";
import { Outlet, useLocation, useMatches, useNavigate, useNavigationType } from "react-router-dom";
import { business } from "../../config";
import { useApp } from "../../context/AppContext";
import { ToastProvider } from "../../context/ToastContext";
import { MAX_STEP, PATHS, type RouteHandle } from "../../router/paths";
import { BackIcon } from "../ui/Icons";
import CargaCatalogo from "../../features/booking/CargaCatalogo";

/**
 * El marco: nav con atrás e idioma, barra de progreso, y la pantalla activa.
 *
 * El `key` por ruta es lo que hace que React desmonte y vuelva a montar la
 * sección en cada paso, que es lo que dispara la animación de entrada. Sin él
 * React reusaría el nodo y el flujo se sentiría como una página que parpadea.
 */
export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const navType = useNavigationType();
  const matches = useMatches();
  const [scrolled, setScrolled] = useState(false);
  const { lang, cambiarIdioma, t } = useApp();

  const step = (matches.at(-1)?.handle as RouteHandle | undefined)?.step ?? 0;
  // "default" es la primera entrada del historial: no hay a dónde volver.
  const puedeVolver = location.pathname !== PATHS.start && location.key !== "default";

  return (
    <div className="stage">
      <div className="protolabel">{business.brand} · {t("sede")}</div>
      <div className="device">
        <ToastProvider>
          <header className={`nav${scrolled ? " scrolled" : ""}`}>
            <button
              className={`back${puedeVolver ? " on" : ""}`}
              aria-label={lang === "es" ? "Atrás" : "Back"}
              onClick={() => navigate(-1)}
            >
              <BackIcon />
            </button>
            <div className="navtitle">{business.brand}</div>
            {/* Muestra el idioma al que se cambia, no el actual: es un botón, no una etiqueta */}
            <button className="lang" onClick={cambiarIdioma} aria-label={lang === "es" ? "Switch to English" : "Cambiar a español"}>
              {lang === "es" ? "EN" : "ES"}
            </button>
          </header>
          <div className="progress">
            <i style={{ width: `${(step / MAX_STEP) * 100}%` }} />
          </div>
          {/* La puerta envuelve el <main> y NO la sección de adentro.
              Esa sección lleva `key={pathname}` para animar cada paso, así que
              React la desmonta y la vuelve a montar en cada navegación — y una
              puerta ahí dentro volvería a pedir el catálogo en cada pantalla.
              Acá se monta una vez y se pide una vez. */}
          <CargaCatalogo>
            <main className="screens">
              <section
                key={location.pathname}
                className={`screen active${navType === "POP" ? " back-anim" : ""}`}
                onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 6)}
              >
                <Outlet />
              </section>
            </main>
          </CargaCatalogo>
        </ToastProvider>
      </div>
    </div>
  );
}
