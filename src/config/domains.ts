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
  // Espejo de `.env.production`, que es quien manda en el build. Esto es la
  // red de abajo: un dominio que no esté acá cae en `localhost`, o sea
  // `apiBaseUrl: ""`, y pide el API contra sí mismo. Todo responde 404 y nada
  // en la pantalla dice por qué.
  "citas.rizosfelices.co": { apiBaseUrl: "https://previewapi.rizosfelices.co", env: "production" },
};

export function resolveDomain(hostname: string = globalThis.location?.hostname ?? "localhost"): DomainConfig {
  return DOMAINS[hostname] ?? DOMAINS.localhost;
}
