import { fromISODate } from "./dates";

export interface CalendarEvent {
  title: string;
  /** YYYY-MM-DD */
  date: string;
  startMins: number;
  durationMins: number;
  location: string;
  description: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const stamp = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

/** Descarga un .ics con la cita */
export function downloadICS({ title, date, startMins, durationMins, location, description }: CalendarEvent): void {
  const start = fromISODate(date);
  start.setMinutes(startMins);
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
