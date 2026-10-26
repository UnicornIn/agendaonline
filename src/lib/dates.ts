import type { Lang } from "../types";

/* =========================================================
   Días y horas

   La disponibilidad de este archivo es simulada y estable: el mismo día se ve
   siempre igual. Cuando el backend exponga los cupos, `horasLibres` es la
   única función que se reemplaza — las pantallas ya solo le preguntan a ella.
   ========================================================= */

export const DOW: Record<Lang, string[]> = {
  es: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};
export const MON: Record<Lang, string[]> = {
  es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

/** YYYY-MM-DD en hora local: toISOString usa UTC y corre el día en la noche */
export const aISO = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function desdeISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const fechaBonita = (d: Date, lang: Lang): string =>
  lang === "es"
    ? `${DOW.es[d.getDay()]} ${d.getDate()} de ${MON.es[d.getMonth()]}`
    : `${DOW.en[d.getDay()]} ${MON.en[d.getMonth()]} ${d.getDate()}`;

export const fechaISOBonita = (iso: string | null, lang: Lang): string =>
  iso ? fechaBonita(desdeISO(iso), lang) : "";

/** Los próximos n días hábiles desde mañana. El domingo la sede no abre. */
export function proximosDias(n = 16): Date[] {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  while (out.length < n) {
    if (d.getDay() !== 0) out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export const HORAS = ["9:00 am", "10:30 am", "12:00 m", "1:30 pm", "3:00 pm", "4:30 pm"];

/** Minutos desde medianoche en que arranca cada hora de la grilla */
const INICIO: Record<string, number> = {
  "9:00 am": 540, "10:30 am": 630, "12:00 m": 720,
  "1:30 pm": 810, "3:00 pm": 900, "4:30 pm": 990,
};
const CIERRE = 18 * 60;

/** Ocupación simulada pero estable: el mismo día siempre se ve igual */
function ocupado(fecha: string, hora: string, estilista: string | null): boolean {
  const s = fecha + hora + (estilista ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 10 < 3;
}

/**
 * Las horas donde el bloque COMPLETO cabe antes de cerrar.
 *
 * Es la regla que evita la cita que empieza a las 4:30 y necesita tres horas:
 * ofrecerla deja a la clienta en el salón después del cierre, o a la estilista
 * cortando el servicio por la mitad.
 */
export function horasLibres(
  fecha: string,
  duracionMinutos: number,
  estilista: string | null
): string[] {
  const dura = duracionMinutos || 90;
  return HORAS.filter((h) => INICIO[h] + dura <= CIERRE).filter((h) => !ocupado(fecha, h, estilista));
}
