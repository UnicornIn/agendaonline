import { business } from "../config";
import { money, hhmm, parseMins } from "./format";
import { must } from "./assert";
import type {
  Booking, BundleComparison, Catalog, ExtraSelection, PricedBooking, Service, ServiceKey, ServiceOption,
} from "../types";

/* Todas las funciones son puras: reciben el catálogo y el estado de la reserva. */

type Diagnosis = Pick<Booking, "dens" | "easy">;

export interface ResolvedPrice {
  price: string;
  time: string;
  mins: number;
  /** Precio numérico exacto; null si solo hay rango */
  n: number | null;
  exact: boolean;
}

export interface BookingTotal extends ResolvedPrice {
  labels: string[];
}

export const allOptions = (svc: Service): ServiceOption[] => [...(svc.options ?? []), ...(svc.easy ?? []), ...(svc.hard ?? [])];

export const findOption = (catalog: Catalog, svcKey: ServiceKey, optId: string): ServiceOption | undefined =>
  allOptions(catalog.services[svcKey]).find((o) => o.id === optId);

/** Lista de opciones que aplica a un servicio según la plasticidad */
export function optionsFor(catalog: Catalog, svcKey: ServiceKey, easy: boolean | null): ServiceOption[] {
  const c = catalog.services[svcKey];
  return (c.needsType ? (easy ? c.easy : c.hard) : c.options) ?? [];
}

export const fullOptionFor = (catalog: Catalog, easy: boolean | null): ServiceOption => {
  const full = catalog.services.full;
  return must((easy === false ? full.hard : full.easy)?.[0], "El catálogo no tiene Servicio Full");
};

/** Precio y tiempo exactos si hay diagnóstico; si no, el rango del catálogo */
export function resolveOption(catalog: Catalog, opt: ServiceOption, { dens, easy }: Diagnosis): ResolvedPrice {
  const m = catalog.matrix[opt.id];
  const i = dens ? catalog.densities.indexOf(dens) : -1;
  const row = m && (easy === false && m.hard ? m.hard : m.easy ?? m.hard);
  if (row && i >= 0) {
    const [n, mins] = row[i];
    return { price: money(n), time: hhmm(mins), mins, n, exact: true };
  }
  return { price: opt.price, time: opt.time, mins: parseMins(opt.time || "2h"), n: null, exact: false };
}

/** "DEF" = definición detallada según plasticidad */
export const resolveExtraId = (id: string, easy: boolean | null): string =>
  id === "DEF" ? (easy === false ? "def-det-h" : "def-det") : id;

export const hasExtra = (booking: Pick<Booking, "extras" | "easy">, svcKey: ServiceKey, id: string): boolean =>
  booking.extras.some((e) => e.k === svcKey && e.id === resolveExtraId(id, booking.easy));

export function toggleExtra(booking: Pick<Booking, "extras" | "easy">, svcKey: ServiceKey, id: string): ExtraSelection[] {
  const rid = resolveExtraId(id, booking.easy);
  const exists = booking.extras.some((e) => e.k === svcKey && e.id === rid);
  return exists
    ? booking.extras.filter((e) => !(e.k === svcKey && e.id === rid))
    : [...booking.extras, { k: svcKey, id: rid }];
}

/** Total del bloque: servicio principal + complementos */
export function computeTotal(catalog: Catalog, booking: PricedBooking): BookingTotal {
  let { n, mins, exact } = resolveOption(catalog, booking.opt, booking);
  const labels = [booking.opt.label];
  for (const e of booking.extras) {
    const o = findOption(catalog, e.k, e.id);
    if (!o) continue;
    const r = resolveOption(catalog, o, booking);
    labels.push(o.label);
    mins += r.mins;
    if (r.n != null && n != null) n += r.n;
    else exact = false;
  }
  return { n, mins, exact, time: hhmm(mins), price: exact && n != null ? money(n) : "por confirmar", labels };
}

export const hasColor = (b: Pick<Booking, "svc" | "extras">): boolean =>
  b.svc === "color" || b.extras.some((e) => e.k === "color");

export const depositFor = (b: Pick<Booking, "svc" | "extras">): number =>
  hasColor(b) ? business.deposit.color : business.deposit.default;

export function balanceText(catalog: Catalog, b: PricedBooking): string {
  const t = computeTotal(catalog, b);
  return t.exact && t.n != null ? money(t.n - depositFor(b)) : "el resto del valor";
}

/** Comparativo "por separado vs Full" */
export function bundleInfo(catalog: Catalog, easy: boolean | null): BundleComparison & { full: ServiceOption } {
  const b = easy === false ? catalog.bundle.hard : catalog.bundle.easy;
  return { full: fullOptionFor(catalog, easy), ...b };
}

export const plasticityText = (easy: boolean | null): string => (easy ? "se forma solo" : "necesita ayuda");
