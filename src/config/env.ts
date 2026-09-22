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
    prefix: "/" + trimSlashes(env.VITE_API_PREFIX ?? "/api/v1"),
    timeoutMs: Number(env.VITE_API_TIMEOUT_MS ?? 15000),
    // Headers fijos para todas las peticiones (p. ej. identificar la sede)
    headers: {
      "X-Branch-Id": env.VITE_BRANCH_ID ?? "suramericana",
    },
  },

  // true = no llama al backend, usa src/api/mocks
  useMocks: String(env.VITE_USE_MOCKS ?? "true") === "true",

  router: {
    mode: env.VITE_ROUTER_MODE === "hash" ? "hash" : "browser",
    basename: "/" + trimSlashes(env.VITE_ROUTER_BASENAME ?? "/"),
  },
});
