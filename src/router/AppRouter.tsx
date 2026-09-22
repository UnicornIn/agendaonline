import { RouterProvider, createBrowserRouter, createHashRouter } from "react-router-dom";
import { config } from "../config";
import { routes } from "./routes";

// browser = URLs limpias · hash = compatible con cualquier hosting estático
const createRouter = config.router.mode === "hash" ? createHashRouter : createBrowserRouter;
const router = createRouter(routes, { basename: config.router.basename });

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
