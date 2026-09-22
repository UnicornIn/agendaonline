/**
 * Registro único de endpoints del backend (relativos a config.api.prefix).
 * Si el backend cambia una ruta, se cambia solo aquí.
 * Los segmentos ":param" se reemplazan con buildPath(), que los exige por tipo.
 */
export const ENDPOINTS = {
  catalog: {
    get: "/branches/:branchId/catalog",
  },
  availability: {
    // GET ?date=YYYY-MM-DD&duration=minutos
    byDate: "/branches/:branchId/availability",
  },
  bookings: {
    create: "/bookings",
    byId: "/bookings/:bookingId",
    // Cliente avisa que ya envió el comprobante del abono
    depositSent: "/bookings/:bookingId/deposit",
  },
} as const;

/** Extrae los nombres de ":param" de una ruta: "/a/:id/b/:x" -> "id" | "x" */
export type PathParams<P extends string> = P extends `${string}:${infer Param}/${infer Rest}`
  ? Param | PathParams<`/${Rest}`>
  : P extends `${string}:${infer Param}`
    ? Param
    : never;

type ParamArgs<P extends string> = [PathParams<P>] extends [never]
  ? []
  : [params: Record<PathParams<P>, string | number>];

export function buildPath<P extends string>(path: P, ...[params]: ParamArgs<P>): string {
  const values = (params ?? {}) as Record<string, string | number | undefined>;
  return path.replace(/:([A-Za-z_]\w*)/g, (_, key: string) => {
    const value = values[key];
    if (value == null) throw new Error(`Falta el parámetro "${key}" para ${path}`);
    return encodeURIComponent(String(value));
  });
}
