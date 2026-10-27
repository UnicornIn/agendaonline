import type { ReactNode } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import { PATHS, type RouteHandle } from "./paths";
import { RequireReserva } from "./guards";
import AppLayout from "../components/layout/AppLayout";
import type { Reserva } from "../types";

import StartPage from "../features/booking/pages/StartPage";
import IdentPage from "../features/booking/pages/IdentPage";
import HistorialPage from "../features/booking/pages/HistorialPage";
import MenuPage from "../features/booking/pages/MenuPage";
import DensityPage from "../features/booking/pages/DensityPage";
import PlasticityPage from "../features/booking/pages/PlasticityPage";
import DetailPage from "../features/booking/pages/DetailPage";
import ExtrasPage from "../features/booking/pages/ExtrasPage";
import DatePage from "../features/booking/pages/DatePage";
import ConfirmPage from "../features/booking/pages/ConfirmPage";
import DepositPage from "../features/booking/pages/DepositPage";
import DonePage from "../features/booking/pages/DonePage";

const guarded = (requires: ReadonlyArray<keyof Reserva>, element: ReactNode) => (
  <RequireReserva requires={requires}>{element}</RequireReserva>
);

const step = (n: number): RouteHandle => ({ step: n });

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { path: PATHS.start, element: <StartPage />, handle: step(0) },
      { path: PATHS.ident, element: <IdentPage />, handle: step(1) },
      { path: PATHS.historial, element: <HistorialPage />, handle: step(2) },
      { path: PATHS.menu, element: <MenuPage />, handle: step(2) },
      { path: PATHS.density, element: guarded(["svc"], <DensityPage />), handle: step(3) },
      { path: PATHS.plasticity, element: guarded(["svc", "dens"], <PlasticityPage />), handle: step(3.6) },
      { path: PATHS.detail, element: guarded(["svc"], <DetailPage />), handle: step(4.2) },
      { path: PATHS.extras, element: guarded(["svc"], <ExtrasPage />), handle: step(4.6) },
      { path: PATHS.date, element: guarded(["svc"], <DatePage />), handle: step(5) },
      { path: PATHS.confirm, element: guarded(["svc", "fecha", "hora"], <ConfirmPage />), handle: step(6) },
      { path: PATHS.deposit, element: guarded(["svc", "fecha", "hora", "nombre"], <DepositPage />), handle: step(6.6) },
      { path: PATHS.done, element: guarded(["svc", "fecha", "hora", "nombre"], <DonePage />), handle: step(7) },
      { path: "*", element: <Navigate to={PATHS.start} replace /> },
    ],
  },
];
