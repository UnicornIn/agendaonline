import { http, type RequestOptions } from "./httpClient";
import { mocks } from "./mocks";
import { config, ENDPOINTS, buildPath, business } from "../config";
import type { AvailabilitySlot, BookingPayload, Catalog, CreatedBooking } from "../types";

const branchId = business.branch.id;

/**
 * Capa de servicios. Los componentes solo importan de aquí: no saben si hay
 * backend real o mocks, ni qué dominio/rutas se usan.
 */
export const catalogApi = {
  get: (): Promise<Catalog> =>
    config.useMocks ? mocks.getCatalog() : http.get<Catalog>(buildPath(ENDPOINTS.catalog.get, { branchId })),
};

export const availabilityApi = {
  byDate: (
    { date, duration }: { date: string; duration: number },
    opts?: RequestOptions
  ): Promise<AvailabilitySlot[]> =>
    config.useMocks
      ? mocks.getAvailability({ date, duration })
      : http.get<AvailabilitySlot[]>(buildPath(ENDPOINTS.availability.byDate, { branchId }), {
          ...opts,
          params: { date, duration },
        }),
};

export const bookingsApi = {
  create: (payload: BookingPayload): Promise<CreatedBooking> =>
    config.useMocks ? mocks.createBooking(payload) : http.post<CreatedBooking>(ENDPOINTS.bookings.create, payload),

  get: (bookingId: string): Promise<CreatedBooking> =>
    http.get<CreatedBooking>(buildPath(ENDPOINTS.bookings.byId, { bookingId })),

  markDepositSent: (bookingId: string): Promise<CreatedBooking> =>
    config.useMocks
      ? mocks.markDepositSent(bookingId)
      : http.post<CreatedBooking>(buildPath(ENDPOINTS.bookings.depositSent, { bookingId }), {}),
};

export { ApiError } from "./httpClient";
