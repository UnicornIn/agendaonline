/* =========================================================
   Tipos de dominio compartidos por toda la app
   ========================================================= */

/** Clave de servicio ("corte", "full"...). Es string para que el catálogo pueda crecer desde el backend. */
export type ServiceKey = string;

export type Density = "Baja" | "Media" | "Alta" | "Extra alta";

export interface ServiceOption {
  id: string;
  label: string;
  /** Rango de precio del catálogo, p. ej. "$60.000–$110.000" */
  price: string;
  /** Duración aproximada, p. ej. "1h 30min" */
  time: string;
  desc?: string;
  includes: string[];
  note?: string;
}

export interface Service {
  name: string;
  from: string;
  /** "full" = densidad + plasticidad · "dens" = solo densidad · sin valor = sin diagnóstico */
  diag?: "full" | "dens";
  /** Las opciones dependen de la plasticidad (easy / hard) */
  needsType?: boolean;
  needsColor?: boolean;
  options?: ServiceOption[];
  easy?: ServiceOption[];
  hard?: ServiceOption[];
}

/** [precio en COP, minutos] por cada densidad, en el orden de Catalog.densities */
export type MatrixRow = Array<[price: number, minutes: number]>;

export interface BundleComparison {
  separatePrice: string;
  separateTime: string;
}

/** [servicio, id de opción | "DEF"] */
export type ExtraRef = [svc: ServiceKey, optionId: string];

export interface Catalog {
  services: Record<ServiceKey, Service>;
  order: ServiceKey[];
  densities: Density[];
  matrix: Record<string, { easy?: MatrixRow; hard?: MatrixRow }>;
  extras: Record<ServiceKey, ExtraRef[]>;
  bundle: { easy: BundleComparison; hard: BundleComparison };
}

/* ---------- Reserva ---------- */

export interface ExtraSelection {
  k: ServiceKey;
  id: string;
}

export interface TimeSlot {
  label: string;
  /** Minutos desde medianoche */
  start: number;
}

export interface AvailabilitySlot extends TimeSlot {
  available: boolean;
}

export interface Booking {
  svc: ServiceKey | null;
  dens: Density | null;
  /** true = el rizo se forma solo · false = necesita ayuda · null = sin diagnóstico */
  easy: boolean | null;
  opt: ServiceOption | null;
  extras: ExtraSelection[];
  /** YYYY-MM-DD */
  date: string | null;
  time: TimeSlot | null;
  name: string;
  phone: string;
  bookingId: string | null;
}

/** Hace obligatorios (no nulos) los campos K de T */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> };

/** Lo mínimo para calcular precio y tiempo */
export type PricedBooking = Pick<Booking, "svc" | "dens" | "easy" | "extras"> & { opt: ServiceOption };

/** Reserva lista para enviarse al backend */
export type ScheduledBooking = WithRequired<Booking, "svc" | "opt" | "date" | "time">;

export interface Contact {
  name: string;
  phone: string;
}

export interface DensityOption {
  value: Density;
  hint: string;
  /** URL del video demostrativo; null = placeholder */
  video: string | null;
}

export interface PlasticityOption {
  value: boolean;
  name: string;
  hint: string;
  video: string | null;
}

/* ---------- API ---------- */

export interface BookingPayload {
  branchId: string;
  channel: "web";
  service: { key: ServiceKey; optionId: string };
  extras: Array<{ key: ServiceKey; optionId: string }>;
  diagnosis: { density: Density; selfForming: boolean | null } | null;
  date: string;
  startMinutes: number;
  durationMinutes: number;
  price: number | null;
  deposit: number;
  customer: Contact;
}

export type BookingStatus = "pending_deposit" | "deposit_sent" | "confirmed" | "cancelled";

export interface CreatedBooking {
  id: string;
  status: BookingStatus;
}
