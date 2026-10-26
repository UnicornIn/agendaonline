import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import { traducir, type ClaveTexto, type Sustituciones } from "../i18n";
import type { Lang, Reserva } from "../types";

/* =========================================================
   El estado de la app: idioma y reserva en curso

   Un solo contexto para los dos porque cambian juntos en casi toda pantalla, y
   separarlos obligaría a cada página a consumir dos hooks para pintar una
   línea de texto con un precio.

   La reserva se guarda en `sessionStorage` para sobrevivir un refresh a mitad
   del flujo, y el idioma en `localStorage` porque es una preferencia de la
   persona, no de esta visita.
   ========================================================= */

const CLAVE_RESERVA = "rf_reserva";
const CLAVE_IDIOMA = "rf_idioma";

export const RESERVA_VACIA: Readonly<Reserva> = Object.freeze({
  modo: null,
  via: "tel",
  pais: "+57",
  tel: "",
  correo: "",
  nombre: "",
  svc: null,
  dens: null,
  plast: null,
  extras: [],
  estilista: null,
  fecha: null,
  hora: null,
  repite: false,
  comprobante: null,
});

function cargarReserva(): Reserva {
  try {
    const raw = sessionStorage.getItem(CLAVE_RESERVA);
    // El comprobante no se restaura: su `url` es un blob: de la sesión
    // anterior, que después de un refresh ya no apunta a nada y pintaría una
    // miniatura rota.
    return raw
      ? { ...RESERVA_VACIA, ...(JSON.parse(raw) as Partial<Reserva>), comprobante: null }
      : { ...RESERVA_VACIA };
  } catch {
    return { ...RESERVA_VACIA };
  }
}

function cargarIdioma(): Lang {
  try {
    const guardado = localStorage.getItem(CLAVE_IDIOMA);
    if (guardado === "es" || guardado === "en") return guardado;
    // Sin preferencia guardada manda el navegador: la clienta extranjera que
    // llega por el link del agente no tiene por qué buscar el botón.
    return navigator.language?.toLowerCase().startsWith("en") ? "en" : "es";
  } catch {
    return "es";
  }
}

export type ParcheReserva = Partial<Reserva> | ((r: Reserva) => Partial<Reserva>);

interface AppContextValue {
  lang: Lang;
  cambiarIdioma: () => void;
  /** Traduce una clave al idioma actual */
  t: (clave: ClaveTexto, rep?: Sustituciones) => string;
  reserva: Reserva;
  actualizar: (parche: ParcheReserva) => void;
  reiniciar: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(cargarIdioma);
  const [reserva, setReserva] = useState<Reserva>(cargarReserva);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(CLAVE_IDIOMA, lang);
    } catch {
      /* sin almacenamiento: vale para esta visita */
    }
  }, [lang]);

  useEffect(() => {
    try {
      sessionStorage.setItem(CLAVE_RESERVA, JSON.stringify({ ...reserva, comprobante: null }));
    } catch {
      /* almacenamiento no disponible: seguimos solo en memoria */
    }
  }, [reserva]);

  const cambiarIdioma = useCallback(() => setLang((l) => (l === "es" ? "en" : "es")), []);

  const t = useCallback(
    (clave: ClaveTexto, rep?: Sustituciones) => traducir(lang, clave, rep),
    [lang]
  );

  const actualizar = useCallback(
    (parche: ParcheReserva) =>
      setReserva((r) => ({ ...r, ...(typeof parche === "function" ? parche(r) : parche) })),
    []
  );

  const reiniciar = useCallback(() => setReserva({ ...RESERVA_VACIA }), []);

  const value = useMemo(
    () => ({ lang, cambiarIdioma, t, reserva, actualizar, reiniciar }),
    [lang, cambiarIdioma, t, reserva, actualizar, reiniciar]
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de <AppProvider>");
  return ctx;
}
