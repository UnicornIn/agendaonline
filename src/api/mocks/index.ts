import { LOCAL_CATALOG } from "../../data/catalog";
import { business } from "../../config";
import type { AvailabilitySlot, BookingPayload, Catalog, CreatedBooking } from "../../types";

const delay = (ms = 250) => new Promise<void>((r) => setTimeout(r, ms));

/* Ocupación simulada y determinista (~30% de los cupos ocupados) */
function isBusy(dateISO: string, slotLabel: string): boolean {
  let h = 0;
  const s = dateISO + slotLabel;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 10 < 3;
}

export const mocks = {
  async getCatalog(): Promise<Catalog> {
    await delay(150);
    return LOCAL_CATALOG;
  },

  async getAvailability({ date, duration }: { date: string; duration: number }): Promise<AvailabilitySlot[]> {
    await delay();
    const { slots, closeAt } = business.schedule;
    return slots
      .filter((s) => s.start + duration <= closeAt)
      .map((s) => ({ ...s, available: !isBusy(date, s.label) }));
  },

  async createBooking(_payload: BookingPayload): Promise<CreatedBooking> {
    await delay(400);
    return { id: "RF-" + Date.now().toString(36).toUpperCase(), status: "pending_deposit" };
  },

  async markDepositSent(bookingId: string): Promise<CreatedBooking> {
    await delay(200);
    return { id: bookingId, status: "deposit_sent" };
  },
};
