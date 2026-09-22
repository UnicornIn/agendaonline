export type AppEnv = "development" | "staging" | "production";

export interface DomainConfig {
  /** "" = mismo origen (usa el proxy de Vite en desarrollo) */
  apiBaseUrl: string;
  env: AppEnv;
}

/**
 * Mapa de dominios: según el hostname donde corre el frontend, se elige
 * a qué backend apuntar. VITE_API_BASE_URL siempre tiene prioridad.
 *
 * Para agregar un ambiente nuevo (otra sede, staging, cliente white-label)
 * basta con añadir una entrada aquí.
 */
export const DOMAINS: Record<string, DomainConfig> = {
  localhost: { apiBaseUrl: "", env: "development" },
  "127.0.0.1": { apiBaseUrl: "", env: "development" },
  "staging.agenda.rizosfelices.co": { apiBaseUrl: "https://api-staging.rizosfelices.co", env: "staging" },
  "agenda.rizosfelices.co": { apiBaseUrl: "https://api.rizosfelices.co", env: "production" },
};

export function resolveDomain(hostname: string = globalThis.location?.hostname ?? "localhost"): DomainConfig {
  return DOMAINS[hostname] ?? DOMAINS.localhost;
}
