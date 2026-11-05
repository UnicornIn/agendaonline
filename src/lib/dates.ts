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

/** El mes completo, para el encabezado del calendario: ahí "nov" se ve corto. */
export const MES_LARGO: Record<Lang, string[]> = {
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio",
       "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  en: ["January", "February", "March", "April", "May", "June",
       "July", "August", "September", "October", "November", "December"],
};

/**
 * Las columnas del calendario, de lunes a domingo.
 *
 * Empieza en lunes porque así se lee una semana acá, no porque el domingo
 * tenga nada de especial: la sede también atiende los domingos.
 */
export const DOW_MIN: Record<Lang, string[]> = {
  es: ["L", "M", "M", "J", "V", "S", "D"],
  en: ["M", "T", "W", "T", "F", "S", "S"],
};

/** YYYY-MM-DD en hora local: toISOString usa UTC y corre el día en la noche */
export const aISO = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function desdeISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Hoy a medianoche. Sin cortar la hora, comparar fechas compara instantes. */
export function hoy(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function sumarDias(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

export const fechaBonita = (d: Date, lang: Lang): string =>
  lang === "es"
    ? `${DOW.es[d.getDay()]} ${d.getDate()} de ${MON.es[d.getMonth()]}`
    : `${DOW.en[d.getDay()]} ${MON.en[d.getMonth()]} ${d.getDate()}`;

export const fechaISOBonita = (iso: string | null, lang: Lang): string =>
  iso ? fechaBonita(desdeISO(iso), lang) : "";

/**
 * Los n días seguidos desde `inicio`, él incluido.
 *
 * TODOS los días, sin saltarse ninguno. Antes se saltaba el domingo, por dar
 * por sentado que la sede no abría: se abre, y los domingos que no hay nada
 * son los que tienen la agenda llena o bloqueada, como cualquier martes. Qué
 * día sirve lo dice la agenda —horarios, bloqueos, citas y retenciones—, y
 * esconder uno acá era esconderlo incluso cuando sí tenía cupo.
 */
export function diasDesde(inicio: Date, n = 16): Date[] {
  const out: Date[] = [];
  const d = new Date(inicio);
  d.setHours(0, 0, 0, 0);
  while (out.length < n) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/** Los próximos n días desde hoy. */
export function proximosDias(n = 16): Date[] {
  // Empieza HOY. Arrancaba manana, y eso le regalaba un dia entero al
  // silencio: a las 12:42 a.m. de un martes el martes completo seguia libre
  // y la web ya no lo ofrecia. Que hoy todavia sirva no lo decide el
  // navegador sino la agenda, que descuenta los cupos pasados y los que
  // empiezan antes de `ANTICIPACION_MINIMA_MINUTOS`; si no queda ninguno, el
  // dia llega sin cupo y el selector lo apaga solo.
  return diasDesde(hoy(), n);
}

/** La columna de un día en una semana que empieza el lunes. */
const columna = (d: Date): number => (d.getDay() + 6) % 7;

/**
 * Las celdas de un mes en la grilla de siete columnas.
 *
 * Los `null` del principio y del final son los huecos antes del día 1 y
 * después del último: se pintan vacíos. Se devuelven en vez de dejar que la
 * grilla los invente para que el mes empiece en su columna real — sin ellos
 * el 1 de noviembre caería en lunes y todas las fechas se leerían corridas.
 */
export function celdasDelMes(anio: number, mes: number): (Date | null)[] {
  const primero = new Date(anio, mes, 1);
  const celdas: (Date | null)[] = Array<Date | null>(columna(primero)).fill(null);
  for (const d = new Date(primero); d.getMonth() === mes; d.setDate(d.getDate() + 1)) {
    celdas.push(new Date(d));
  }
  while (celdas.length % 7) celdas.push(null);
  return celdas;
}

/* La grilla de horas y la ocupación simulada vivían acá. Se fueron cuando la
   pantalla de fecha pasó a preguntarle a la agenda: las horas libres dependen
   del horario de cada profesional, de sus bloqueos, de las citas que ya tiene
   y de las retenciones de otras clientas, y ninguna de esas cuatro cosas la
   sabe el navegador. Ver `agendaApi.disponibilidad`. */
