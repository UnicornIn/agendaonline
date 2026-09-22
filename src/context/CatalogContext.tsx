import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { catalogApi } from "../api";
import { LOCAL_CATALOG } from "../data/catalog";
import type { Catalog } from "../types";

const CatalogContext = createContext<Catalog | null>(null);

interface CatalogState {
  catalog: Catalog | null;
  error: unknown;
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CatalogState>({ catalog: null, error: null });

  useEffect(() => {
    let alive = true;
    catalogApi
      .get()
      .then((catalog) => alive && setState({ catalog, error: null }))
      // Si el backend falla, seguimos con el catálogo local para no bloquear la agenda
      .catch((error: unknown) => alive && setState({ catalog: LOCAL_CATALOG, error }));
    return () => {
      alive = false;
    };
  }, []);

  if (!state.catalog) return <div className="loader">Cargando…</div>;
  return <CatalogContext.Provider value={state.catalog}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): Catalog {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog debe usarse dentro de <CatalogProvider>");
  return ctx;
}
