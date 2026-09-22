import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Booking } from "../types";

const STORAGE_KEY = "rf_booking";

export const EMPTY_BOOKING: Readonly<Booking> = Object.freeze({
  svc: null,
  dens: null,
  easy: null,
  opt: null,
  extras: [],
  date: null,
  time: null,
  name: "",
  phone: "",
  bookingId: null,
});

export type BookingPatch = Partial<Booking> | ((b: Booking) => Partial<Booking>);

interface BookingContextValue {
  booking: Booking;
  update: (patch: BookingPatch) => void;
  reset: () => void;
}

function load(): Booking {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY_BOOKING, ...(JSON.parse(raw) as Partial<Booking>) } : { ...EMPTY_BOOKING };
  } catch {
    return { ...EMPTY_BOOKING };
  }
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<Booking>(load);

  // Persistimos en la sesión para sobrevivir un refresh en medio del flujo
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } catch {
      /* almacenamiento no disponible: seguimos solo en memoria */
    }
  }, [booking]);

  const update = useCallback(
    (patch: BookingPatch) => setBooking((b) => ({ ...b, ...(typeof patch === "function" ? patch(b) : patch) })),
    []
  );
  const reset = useCallback(() => setBooking({ ...EMPTY_BOOKING }), []);

  const value = useMemo(() => ({ booking, update, reset }), [booking, update, reset]);
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking debe usarse dentro de <BookingProvider>");
  return ctx;
}
