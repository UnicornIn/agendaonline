import { resolveDomain } from "./domains";

export type RouterMode = "browser" | "hash";

export interface AppConfig {
  env: string;
  api: {
    baseUrl: string;
    prefix: string;
    timeoutMs: number;
    headers: Record<string, string>;
  };
  useMocks: boolean;
  router: {
    mode: RouterMode;
    basename: string;
  };
}

const env = import.meta.env;
const domain = resolveDomain();

const trimSlashes = (s = ""): string => s.replace(/^\/+|\/+$/g, "");

/**
 * Configuración central de la app. Todo lo que cambia entre ambientes vive aquí.
 */
export const config: Readonly<AppConfig> = Object.freeze<AppConfig>({
  env: domain.env ?? env.MODE,

  api: {
    // Dominio del backend: .env > mapa de dominios > mismo origen
    baseUrl: (env.VITE_API_BASE_URL || domain.apiBaseUrl || "").replace(/\/+$/, ""),
    prefix: "/" + trimSlashes(env.VITE_API_PREFIX ?? "/public/agendamiento"),
    timeoutMs: Number(env.VITE_API_TIMEOUT_MS ?? 15000),
    // Sin headers fijos. La sede la decide el servidor: mandarla desde acá
    // sería dejar que el navegador elija en qué sede agenda.
    headers: {},
  },

  // true = no llama al backend, usa src/api/mocks
  useMocks: String(env.VITE_USE_MOCKS ?? "true") === "true",

  router: {
    mode: env.VITE_ROUTER_MODE === "hash" ? "hash" : "browser",
    basename: "/" + trimSlashes(env.VITE_ROUTER_BASENAME ?? "/"),
  },
});
