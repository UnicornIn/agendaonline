export const money = (n: number): string => "$" + n.toLocaleString("es-CO");

export function hhmm(mins: number): string {
  const h = Math.floor(mins / 60);
  const r = mins % 60;
  return r ? `${h}h ${r}min` : `${h}h`;
}

export function parseMins(text: string): number {
  const h = Number(text.match(/(\d+)h/)?.[1] ?? 0);
  const m = Number(text.match(/(\d+)min/)?.[1] ?? 0);
  return h * 60 + m;
}

export const firstName = (name = ""): string => name.trim().split(/\s+/)[0] ?? "";
