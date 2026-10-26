import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { PATHS, type AppPath } from "./paths";
import type { Reserva } from "../types";

interface RequireReservaProps {
  /** Campos de la reserva que deben existir para entrar a este paso */
  requires?: ReadonlyArray<keyof Reserva>;
  fallback?: AppPath;
  children: ReactNode;
}

/**
 * Evita entrar a un paso sin los datos previos: un deep link, un refresh sin
 * sesión, o el botón atrás después de reiniciar. Sin esto la pantalla de
 * confirmación se pintaría sin servicio y reventaría al calcular el total.
 */
export function RequireReserva({ requires = [], fallback = PATHS.menu, children }: RequireReservaProps) {
  const { reserva } = useApp();
  const falta = requires.some((k) => reserva[k] == null || reserva[k] === "");
  return falta ? <Navigate to={fallback} replace /> : <>{children}</>;
}
