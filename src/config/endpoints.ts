/**
 * Registro único de endpoints del backend (relativos a config.api.prefix).
 * Si el backend cambia una ruta, se cambia solo aquí.
 * Los segmentos ":param" se reemplazan con buildPath(), que los exige por tipo.
 *
 * Todas cuelgan del módulo público de autoagendamiento del backend de agenda
 * (`/public/agendamiento`). El contrato está en docs/autoagendamiento-api.md.
 *
 * La sede NO viaja en ninguna de estas rutas: la fija el servidor. Un sede_id
 * que venga del navegador es un sede_id que cualquiera puede cambiar.
 */
export const ENDPOINTS = {
  /** Sede, abono, medios de pago, políticas y los parámetros de la agenda */
  config: "/config",
  /** Servicios agendables de la sede, con los ejes del nombre ya interpretados */
  catalogo: "/catalogo",
  /** ?servicioIds=SV-1,SV-2 — quienes prestan todos esos servicios */
  profesionales: "/profesionales",
  disponibilidad: {
    // ?fecha=YYYY-MM-DD&servicioIds=&profesionalId=
    porFecha: "/disponibilidad",
    // ?desde=&hasta=&servicioIds= — para pintar en gris los días sin cupo
    porDias: "/disponibilidad/dias",
  },
  retencion: {
    crear: "/retencion",
    liberar: "/retencion/:retencionId",
  },
  cita: {
    crear: "/cita",
  },
  /**
   * La vía rápida de la clienta que vuelve. El servidor la reconoce contra la
   * base de clientas de la agenda —celular, correo, nombre + correo— igual que
   * al crear la cita, y exige además que el nombre tecleado concuerde con el
   * guardado. Ver docs/autoagendamiento-api.md.
   */
  clienta: {
    historial: "/clienta/historial",
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
