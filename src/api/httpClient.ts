import { config } from "../config";

/**
 * Códigos que el backend de autoagendamiento devuelve en `error.codigo`.
 * Las páginas reaccionan distinto a cada uno: `cupo_tomado` recarga el día,
 * `retencion_vencida` devuelve a elegir hora, el resto solo muestra el mensaje.
 */
export type ApiErrorCode =
  | "cupo_tomado"
  | "retencion_vencida"
  | "datos_invalidos"
  | "servicio_no_disponible"
  | "demasiadas_solicitudes"
  | "agenda_no_disponible"
  | "sin_conexion";

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;
  readonly url: string;
  /** Sin valor cuando el error no vino del backend (red caída, timeout) */
  readonly code: ApiErrorCode | string | null;

  constructor(
    message: string,
    { status = 0, data = null, url = "", code = null }: { status?: number; data?: unknown; url?: string; code?: string | null } = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.url = url;
    this.code = code;
  }
}

/** `{ error: { codigo, mensaje } }` del contrato, tolerando respuestas que no lo sigan */
interface ErrorBody {
  error?: { codigo?: string; mensaje?: string };
  /** FastAPI responde así cuando el error lo levanta algo fuera del módulo */
  detail?: string;
  message?: string;
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  params?: QueryParams;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function buildUrl(path: string, params?: QueryParams): string {
  const url = `${config.api.baseUrl}${config.api.prefix}${path.startsWith("/") ? path : "/" + path}`;
  if (!params) return url;
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => [k, String(v)]);
  const qs = new URLSearchParams(entries).toString();
  return qs ? `${url}?${qs}` : url;
}

async function request<T>(
  path: string,
  { method = "GET", params, body, headers, signal, timeoutMs }: RequestOptions & { method?: HttpMethod; body?: unknown } = {}
): Promise<T> {
  const url = buildUrl(path, params);
  const ctrl = new AbortController();
  const timer = setTimeout(
    () => ctrl.abort(new DOMException("timeout", "TimeoutError")),
    timeoutMs ?? config.api.timeoutMs
  );
  signal?.addEventListener("abort", () => ctrl.abort(signal.reason), { once: true });

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...config.api.headers,
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const data: unknown = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      const body = (data ?? {}) as ErrorBody;
      // El backend ya redacta `mensaje` para mostrárselo a la clienta tal cual.
      const message = body.error?.mensaje ?? body.detail ?? body.message ?? `Error ${res.status}`;
      throw new ApiError(message, { status: res.status, data, url, code: body.error?.codigo ?? null });
    }
    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const msg = (err as Error)?.name === "TimeoutError" ? "La solicitud tardó demasiado" : "No pudimos conectar con el servidor";
    throw new ApiError(msg, { url, code: "sin_conexion" });
  } finally {
    clearTimeout(timer);
  }
}

export const http = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>(path, { ...opts, method: "POST", body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>(path, { ...opts, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: "DELETE" }),
};
