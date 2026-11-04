/* =========================================================
   Meta Pixel

   El script base lo carga `index.html`, que es donde Meta lo quiere: arranca
   con el HTML, antes de que React exista, y manda el PageView de la primera
   carga. Acá vive todo lo demás.

   Dos cosas que esta web hace distinto a una página normal:

   1. Es una SPA. La clienta recorre ocho pantallas sin que el navegador
      recargue, así que para Meta sería una sola visita. El PageView de cada
      paso lo manda `useMetaPixel`.
   2. El píxel se pierde seguido —bloqueadores, Safari en iPhone— y por eso el
      backend manda la misma conversión por la Conversions API.
      `obtenerContextoMeta()` es lo que hace que esa copia del servidor no
      llegue anónima: lleva las cookies que Meta le puso a este navegador.

   Qué NO se manda desde acá: nombre, celular ni correo. El emparejamiento con
   datos hasheados, si se hace, se hace en el servidor.
   ========================================================= */

type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

/** Parámetros de un evento. Sin datos personales: servicio, valor y moneda. */
interface DatosEvento {
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
}

/** Lo que las pantallas saben del servicio elegido */
export interface ServicioMedido {
  /** Nombre visible, p. ej. "Servicio Full + Ozonoterapia" */
  servicio: string;
  /** El precio real del servicio elegido, o null si todavía es un rango */
  precio: number | null;
  /** Los `servicio_id` de la agenda, el mismo identificador que la factura */
  ids?: string[];
}

const MONEDA = "COP";

/**
 * Si el script no cargó —bloqueador, sin red, id vacío en desarrollo—,
 * `window.fbq` no existe y acá no pasa nada. Ningún evento debe poder tumbar
 * el agendamiento: medir es lo secundario, la cita es lo que importa.
 */
function enviar(evento: string, datos?: DatosEvento, eventID?: string): void {
  try {
    window.fbq?.("track", evento, datos, eventID ? { eventID } : undefined);
  } catch {
    /* el píxel nunca rompe el flujo */
  }
}

function contenido({ servicio, precio, ids }: ServicioMedido): DatosEvento {
  return {
    content_name: servicio || undefined,
    content_ids: ids?.length ? ids : undefined,
    content_type: "product",
    // Solo cuando el valor es exacto. Sin diagnóstico el precio es un rango, y
    // mandar la punta baja como `value` le enseña a Meta un ticket promedio
    // que el salón no cobra.
    value: precio ?? undefined,
    currency: MONEDA,
  };
}

/** Vio un servicio con su precio */
export function trackViewContent(s: ServicioMedido): void {
  enviar("ViewContent", contenido(s));
}

/** Eligió día y hora: empezó a cerrar */
export function trackInitiateCheckout(s: ServicioMedido): void {
  enviar("InitiateCheckout", contenido(s));
}

/**
 * La conversión. Se manda SOLO cuando la agenda confirmó la cita, nunca al
 * tocar el botón: un clic no es una cita, y una cita que falló contada como
 * conversión le enseña a Meta a buscar gente que no agenda.
 *
 * El `reservaId` viaja como `eventID`. Eso hace dos cosas: la pantalla se
 * repinta en cada refresh y en cada botón atrás sin que la cita cuente dos
 * veces, y cuando el backend mande la misma cita por la Conversions API, Meta
 * reconoce que es el mismo hecho.
 */
export function trackSchedule({ reservaId, ...s }: ServicioMedido & { reservaId: string }): void {
  if (yaPaso(reservaId)) return;
  marcar(reservaId);
  enviar("Schedule", contenido(s), reservaId);
}

/* ---------- el puente con la Conversions API ---------- */

/**
 * El interruptor de la Conversions API.
 *
 * En `false` el contexto se calcula pero no se manda. Está así porque el
 * backend todavía no recibe el campo `meta` en `POST /cita`, y un campo que el
 * servidor no espera puede hacerle rechazar la petición entera: la clienta
 * perdería la cita por una métrica.
 *
 * Se enciende el día que `app/selfbooking/` lo acepte y mande el evento. Nada
 * más hay que tocar de este lado.
 */
export const MANDAR_CONTEXTO_META = false;

export interface ContextoMeta {
  /** Cookie `_fbp`: identifica a este navegador */
  fbp: string | null;
  /** Cookie `_fbc`: de qué anuncio llegó */
  fbc: string | null;
  event_source_url: string;
  client_user_agent: string;
}

/**
 * Lo que el backend necesita para que su copia del evento no llegue anónima.
 *
 * Sin `fbp`/`fbc`, Meta recibe el evento del servidor pero no sabe a qué
 * persona ni a qué anuncio pertenece, y la conversión no se le atribuye a la
 * campaña que la produjo.
 */
export function obtenerContextoMeta(): ContextoMeta {
  return {
    fbp: leerCookie("_fbp"),
    fbc: leerCookie("_fbc"),
    event_source_url: window.location.href,
    client_user_agent: navigator.userAgent,
  };
}

/**
 * Crea la cookie `_fbc` a mano cuando la URL trae `fbclid` y el píxel todavía
 * no la puso.
 *
 * Hay que llamarla ANTES de que el router toque la URL: `fbclid` viene en el
 * enlace del anuncio, y en cuanto la clienta avanza un paso el parámetro
 * desaparece. Si para entonces no se guardó, esa visita queda sin saber de qué
 * anuncio vino —y es justo la visita que vino de pauta—.
 */
export function asegurarFbc(): void {
  try {
    const fbclid = new URLSearchParams(window.location.search).get("fbclid");
    if (!fbclid || leerCookie("_fbc")) return;
    // El formato que Meta espera: fb.<subdominio>.<cuándo>.<fbclid>
    const valor = `fb.1.${Date.now()}.${fbclid}`;
    const noventaDias = 90 * 24 * 60 * 60;
    document.cookie = `_fbc=${valor}; max-age=${noventaDias}; path=/; SameSite=Lax`;
  } catch {
    /* sin cookies: se mide igual, solo que peor */
  }
}

function leerCookie(nombre: string): string | null {
  try {
    const par = document.cookie.split("; ").find((c) => c.startsWith(`${nombre}=`));
    return par ? decodeURIComponent(par.slice(nombre.length + 1)) : null;
  } catch {
    return null;
  }
}

/* ---------- una cita, un evento ---------- */

const CLAVE_VISTOS = "rf_pixel_citas";

function leerVistos(): string[] {
  try {
    const raw = sessionStorage.getItem(CLAVE_VISTOS);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function yaPaso(id: string): boolean {
  return leerVistos().includes(id);
}

function marcar(id: string): void {
  try {
    sessionStorage.setItem(CLAVE_VISTOS, JSON.stringify([...leerVistos(), id]));
  } catch {
    /* sin almacenamiento: el eventID sigue deduplicando del lado de Meta */
  }
}
