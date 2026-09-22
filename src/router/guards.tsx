import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import { PATHS, type AppPath } from "./paths";
import type { Booking } from "../types";

interface RequireBookingProps {
  /** Campos de la reserva que deben existir para entrar a este paso */
  requires?: ReadonlyArray<keyof Booking>;
  fallback?: AppPath;
  children: ReactNode;
}

/** Evita entrar a un paso sin los datos previos (deep link, refresh sin sesión). */
export function RequireBooking({ requires = [], fallback = PATHS.menu, children }: RequireBookingProps) {
  const { booking } = useBooking();
  const missing = requires.some((k) => booking[k] == null || booking[k] === "");
  return missing ? <Navigate to={fallback} replace /> : <>{children}</>;
}
