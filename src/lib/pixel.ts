/* =========================================================
   Meta Pixel

   El snippet que da Meta se pega en el <head> y se queda ahí: un id fijo,
   dentro del HTML, que dispara en todos los ambientes. Acá el id es una
   variable de entorno y el script se carga desde TypeScript, por dos razones:

   1. En desarrollo no hay id, así que el píxel no existe. Cada vez que alguien
      del equipo prueba el flujo en su máquina no le mete visitas falsas a la
      cuenta de anuncios.
   2. Es una SPA. El snippet manda UN PageView, el de la carga inicial, y
      después la clienta recorre ocho pantallas sin que el navegador vuelva a
      cargar nada: para Meta sería una sola visita. El PageView de cada paso lo
      manda `useMetaPixel`.

   Qué NO se manda: nombre, celular ni correo. Meta los acepta (advanced
   matching) pero exige hashearlos, y mandarle los datos de contacto de la
   clienta a un tercero es una decisión del negocio, no de la web.
   ========================================================= */

/** Eventos estándar de Meta que usa el embudo. Fuera de esta lista hay que usar `trackCustom`. */
export type EventoMeta =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Lead"
  | "Schedule"
  | "Purchase";

/** Parámetros del evento. Sin datos personales: solo servicio, valor y moneda. */
export interface DatosEvento {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
  predicted_ltv?: number;
}

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
  push?: unknown;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

const ID = (import.meta.env.VITE_META_PIXEL_ID ?? "").trim();

/** Un id de píxel es solo dígitos. Una variable mal puesta no debe cargar nada. */
export const pixelActivo = /^\d{6,}$/.test(ID);

const CLAVE_VISTOS = "rf_pixel_vistos";
let iniciado = false;

/**
 * El cargador de Meta, en TypeScript.
 *
 * `fbq` se define antes de que el script llegue y encola lo que se le pida
 * mientras tanto. Por eso se puede llamar `track` desde el primer render sin
 * esperar a que la red responda: nada se pierde.
 */
function cargarScript(): void {
  if (window.fbq) return;

  const encolar: Fbq = function (this: unknown, ...args: unknown[]) {
    if (encolar.callMethod) encolar.callMethod.apply(encolar, args);
    else encolar.queue?.push(args);
  };
  encolar.queue = [];
  encolar.loaded = true;
  encolar.version = "2.0";
  encolar.push = encolar;

  window.fbq = encolar;
  window._fbq ??= encolar;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
}

/**
 * Arranca el píxel. Se llama una vez, en `main.tsx`.
 *
 * No manda el PageView de entrada a propósito: lo manda `useMetaPixel` junto
 * con la primera ruta, y así hay exactamente uno por pantalla en vez de dos
 * en la portada y ninguno en el resto.
 */
export function iniciarPixel(): void {
  if (!pixelActivo || iniciado) return;
  iniciado = true;
  cargarScript();
  window.fbq?.("init", ID);
}

/** Manda un evento estándar. Sin píxel configurado no hace nada. */
export function track(evento: EventoMeta, datos?: DatosEvento, eventID?: string): void {
  if (!pixelActivo) return;
  window.fbq?.("track", evento, datos, eventID ? { eventID } : undefined);
}

/** Para eventos que no están en el catálogo de Meta (hay que crearlos en el administrador). */
export function trackCustom(evento: string, datos?: DatosEvento): void {
  if (!pixelActivo) return;
  window.fbq?.("trackCustom", evento, datos);
}

/**
 * Manda un evento una sola vez por `clave`.
 *
 * La conversión se dispara al pintar la pantalla de "listo", y esa pantalla se
 * vuelve a pintar si la clienta recarga o le da atrás. Sin esto, una cita
 * contaría como tres.
 *
 * La `clave` viaja además como `eventID`: si algún día la sede manda la misma
 * cita por la Conversions API desde el backend, Meta reconoce que es el mismo
 * hecho y no lo cuenta dos veces.
 */
export function trackUnaVez(clave: string, evento: EventoMeta, datos?: DatosEvento): void {
  if (!pixelActivo || yaPaso(clave)) return;
  marcar(clave);
  track(evento, datos, clave);
}

function leerVistos(): string[] {
  try {
    const raw = sessionStorage.getItem(CLAVE_VISTOS);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function yaPaso(clave: string): boolean {
  return leerVistos().includes(clave);
}

function marcar(clave: string): void {
  try {
    sessionStorage.setItem(CLAVE_VISTOS, JSON.stringify([...leerVistos(), clave]));
  } catch {
    /* sin almacenamiento: puede repetirse en un refresh, pero el evento sale */
  }
}
