import type { ReactNode } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import { PATHS, type RouteHandle } from "./paths";
import { RequireBooking } from "./guards";
import AppLayout from "../components/layout/AppLayout";
import type { Booking } from "../types";

import StartPage from "../features/booking/pages/StartPage";
import MenuPage from "../features/booking/pages/MenuPage";
import DensityPage from "../features/booking/pages/DensityPage";
import PlasticityPage from "../features/booking/pages/PlasticityPage";
import OptionsPage from "../features/booking/pages/OptionsPage";
import DetailPage from "../features/booking/pages/DetailPage";
import AddonsPage from "../features/booking/pages/AddonsPage";
import DatePage from "../features/booking/pages/DatePage";
import ConfirmPage from "../features/booking/pages/ConfirmPage";
import DepositPage from "../features/booking/pages/DepositPage";
import DonePage from "../features/booking/pages/DonePage";

const guarded = (requires: ReadonlyArray<keyof Booking>, element: ReactNode) => (
  <RequireBooking requires={requires}>{element}</RequireBooking>
);

const step = (n: number): RouteHandle => ({ step: n });

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { path: PATHS.start, element: <StartPage />, handle: step(0) },
      { path: PATHS.menu, element: <MenuPage />, handle: step(1) },
      { path: PATHS.density, element: guarded(["svc"], <DensityPage />), handle: step(2) },
      { path: PATHS.plasticity, element: guarded(["svc", "dens"], <PlasticityPage />), handle: step(2.6) },
      { path: PATHS.options, element: guarded(["svc"], <OptionsPage />), handle: step(3.2) },
      { path: PATHS.detail, element: guarded(["svc", "opt"], <DetailPage />), handle: step(4) },
      { path: PATHS.addons, element: guarded(["svc", "opt"], <AddonsPage />), handle: step(4.5) },
      { path: PATHS.date, element: guarded(["svc", "opt"], <DatePage />), handle: step(5) },
      { path: PATHS.confirm, element: guarded(["svc", "opt", "date", "time"], <ConfirmPage />), handle: step(6) },
      { path: PATHS.deposit, element: guarded(["svc", "opt", "date", "time", "name"], <DepositPage />), handle: step(6.6) },
      { path: PATHS.done, element: guarded(["svc", "opt", "date", "time", "name"], <DonePage />), handle: step(7) },
      { path: "*", element: <Navigate to={PATHS.start} replace /> },
    ],
  },
];
