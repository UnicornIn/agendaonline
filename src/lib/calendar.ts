import { desdeISO } from "./dates";

export interface CalendarEvent {
  title: string;
  /** YYYY-MM-DD */
  date: string;
  /** La hora como la muestra la grilla: "10:30 am", "12:00 m" */
  hora: string;
  durationMins: number;
  location: string;
  description: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const stamp = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

/**
 * "10:30 am" -> 630 minutos desde medianoche.
 *
 * "12:00 m" es mediodía en Colombia, no medianoche: tratarlo como am dejaría
 * la cita en el calendario doce horas antes.
 */
export function minutosDeHora(hora: string): number {
  const m = hora.trim().toLowerCase().match(/^(\d{1,2}):(\d{2})\s*(am|pm|m)?$/);
  if (!m) return 0;
  let h = Number(m[1]);
  const sufijo = m[3];
  if (sufijo === "pm" && h !== 12) h += 12;
  if (sufijo === "am" && h === 12) h = 0;
  return h * 60 + Number(m[2]);
}

/** Descarga un .ics con la cita */
export function descargarICS({ title, date, hora, durationMins, location, description }: CalendarEvent): void {
  const start = desdeISO(date);
  start.setMinutes(minutosDeHora(hora));
  const end = new Date(start.getTime() + durationMins * 60000);
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Rizos Felices//Agenda//ES",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@rizosfelices`,
    `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${title}`, `LOCATION:${location}`, `DESCRIPTION:${description}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "cita-rizos-felices.ics" });
  a.click();
  URL.revokeObjectURL(url);
}
