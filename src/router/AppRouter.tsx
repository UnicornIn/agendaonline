import { useMemo } from "react";
import { RouterProvider, createBrowserRouter, createHashRouter } from "react-router-dom";
import { config } from "../config";
import { routes } from "./routes";

// browser = URLs limpias · hash = compatible con cualquier hosting estático
const createRouter = config.router.mode === "hash" ? createHashRouter : createBrowserRouter;

/**
 * El router del flujo de agendamiento, colgado de UNA sede.
 *
 * El apodo de la sede entra como `basename` y no como un `/:sede` envolviendo
 * las rutas. La diferencia se nota en todo lo demás: con el basename, cada
 * `navigate(PATHS.fecha)` y cada comparación contra `PATHS.start` siguen
 * escritas como estaban —React Router le pone y le quita el prefijo solo— y
 * la URL de la clienta igual dice `/sabaneta/fecha`. Con un `/:sede` habría
 * que tocar cada una de las doce pantallas para que supiera en qué sede está,
 * que es la clase de cambio donde se olvida una.
 *
 * Por eso el router se arma DESPUÉS de resolver la sede, en `Arranque`: el
 * basename se fija al crearlo y no se puede cambiar en caliente. El `useMemo`
 * está por eso mismo, no por rendimiento — rearmar el router en cada render
 * le borraría el historial de navegación a la clienta.
 */
export default function AppRouter({ basename }: { basename: string }) {
  const router = useMemo(() => createRouter(routes, { basename }), [basename]);
  return <RouterProvider router={router} />;
}
