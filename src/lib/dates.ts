import { business } from "../config";

export const DOW = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"] as const;
export const MON = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const;

/** YYYY-MM-DD en hora local (toISOString usa UTC y corre el día en la noche) */
export const toISODate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const prettyDate = (d: Date): string => `${DOW[d.getDay()]} ${d.getDate()} de ${MON[d.getMonth()]}`;
export const prettyISO = (iso: string | null): string => (iso ? prettyDate(fromISODate(iso)) : "");

/** Próximos n días hábiles desde mañana */
export function upcomingDays(n: number = business.schedule.daysAhead): Date[] {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  while (out.length < n) {
    if (!business.schedule.closedWeekdays.includes(d.getDay())) out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}
