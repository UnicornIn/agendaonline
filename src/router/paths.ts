/**
 * Todas las URLs de la app en un solo lugar. Para cambiar un slug
 * (p. ej. /servicios -> /menu) se edita solo aquí.
 */
export const PATHS = {
  start: "/",
  menu: "/servicios",
  density: "/diagnostico/densidad",
  plasticity: "/diagnostico/plasticidad",
  options: "/opciones",
  detail: "/detalle",
  addons: "/complementos",
  date: "/fecha",
  confirm: "/confirmar",
  deposit: "/abono",
  done: "/listo",
} as const;

export type AppPath = (typeof PATHS)[keyof typeof PATHS];

/** Metadatos por ruta (`handle` de React Router) */
export interface RouteHandle {
  /** Avance de la barra de progreso, de 0 a MAX_STEP */
  step: number;
}

export const MAX_STEP = 7;
