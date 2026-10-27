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
  // Empieza HOY. Arrancaba manana, y eso le regalaba un dia entero al
  // silencio: a las 12:42 a.m. de un martes el martes completo seguia libre
  // y la web ya no lo ofrecia. Que hoy todavia sirva no lo decide el
  // navegador sino la agenda, que descuenta los cupos pasados y los que
  // empiezan antes de `ANTICIPACION_MINIMA_MINUTOS`; si no queda ninguno, el
  // dia llega sin cupo y el selector lo apaga solo.
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (out.length < n) {
    if (d.getDay() !== 0) out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/* La grilla de horas y la ocupación simulada vivían acá. Se fueron cuando la
   pantalla de fecha pasó a preguntarle a la agenda: las horas libres dependen
   del horario de cada profesional, de sus bloqueos, de las citas que ya tiene
   y de las retenciones de otras clientas, y ninguna de esas cuatro cosas la
   sabe el navegador. Ver `agendaApi.disponibilidad`. */
