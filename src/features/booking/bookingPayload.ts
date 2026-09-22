import { business } from "../../config";
import { computeTotal, depositFor } from "../../lib/pricing";
import type { BookingPayload, Catalog, ScheduledBooking } from "../../types";

/** Cuerpo de POST /bookings. Ajusta aquí si el backend espera otra forma. */
export function toBookingPayload(catalog: Catalog, b: ScheduledBooking): BookingPayload {
  const t = computeTotal(catalog, b);
  return {
    branchId: business.branch.id,
    channel: "web",
    service: { key: b.svc, optionId: b.opt.id },
    extras: b.extras.map((e) => ({ key: e.k, optionId: e.id })),
    diagnosis: b.dens ? { density: b.dens, selfForming: b.easy } : null,
    date: b.date,
    startMinutes: b.time.start,
    durationMinutes: t.mins,
    price: t.exact ? t.n : null,
    deposit: depositFor(b),
    customer: { name: b.name, phone: b.phone },
  };
}
