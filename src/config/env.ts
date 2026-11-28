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
  /**
   * Los `profesional_id` que saben usar máquina, POR SEDE. Vacío = no se
   * pregunta.
   *
   * Va por sede y no en una lista sola porque cada una tiene su propio
   * plantel: Maicol y Sergio existen en Suramericana y en ninguna otra. Con
   * una lista global, la pregunta saldría en las ocho sedes y en siete de
   * ellas "con máquina" no tendría a nadie detrás — un camino que termina en
   * "nadie disponible" después de hacer elegir.
   *
   * Es una LISTA DE QUIÉN, no un servicio: cortar con máquina no es algo que
   * el salón venda, es algo que unas personas saben hacer y otras no.
   * Modelarlo como servicio metía un renglón de $0 en cada cita y lo
   * arrastraba a reportes y comisiones.
   *
   * Vive en el frontend porque es lo que se despliega rápido, y a cambio
   * NO SE PUEDE IMPONER: el servidor no conoce esta lista, así que lo único
   * que la hace valer es que la web mande un `profesionalId` de los de acá.
   * Por eso, con máquina, la pantalla de fecha obliga a escoger estilista y
   * esconde "la primera disponible" —que es justo donde el servidor elegiría
   * por su cuenta y podría caer en alguien que solo corta con tijera.
   *
   * El día que el backend tenga su propia bandera, esta lista se borra y la
   * pregunta sigue igual.
   */
  profesionalesMaquina: Record<string, string[]>;
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

  // "suramericana:ES-73238,ES-32141;cali-norte:ES-99999"
  // Una sede mal escrita se ignora sola: su apodo nunca coincide y la
  // pregunta no aparece ahí, que es preferible a ofrecerla sin nadie detrás.
  profesionalesMaquina: Object.fromEntries(
    String(env.VITE_PROFESIONALES_MAQUINA ?? "")
      .split(";")
      .map((bloque) => bloque.split(":"))
      .filter(([sede, ids]) => sede?.trim() && ids?.trim())
      .map(([sede, ids]) => [
        sede.trim(),
        ids.split(",").map((i) => i.trim()).filter(Boolean),
      ])
  ),

  router: {
    mode: env.VITE_ROUTER_MODE === "hash" ? "hash" : "browser",
    basename: "/" + trimSlashes(env.VITE_ROUTER_BASENAME ?? "/"),
  },
});
