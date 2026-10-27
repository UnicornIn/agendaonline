import { http } from "./httpClient";

/* =========================================================
   El backend de la agenda

   Todo lo que la web sabe del negocio sale de acá: qué servicios hay, cuánto
   valen, cuánto duran, quién los presta y a qué horas queda cupo. Nada de eso
   vive en el frontend, porque nada de eso lo decide el frontend.

   La sede NO viaja en ninguna llamada: la fija el servidor. Un `sede_id` que
   venga del navegador es un `sede_id` que cualquiera puede cambiar.
   ========================================================= */

/** Un servicio tal como lo manda `/catalogo`. */
export interface ServicioApi {
  servicioId: string;
  nombre: string;
  categoria: string | null;
  duracionMinutos: number;
  /** Entero en la moneda de la sede. La agenda trabaja en COP. */
  precio: number;
  ejes: {
    familia: string | null;
    densidad: string | null;
    /** "pa" | "pb" | null. Null = esa familia no distingue plasticidad. */
    plasticidad: string | null;
    afro: boolean;
    nino: boolean;
  };
}

export interface ProfesionalApi {
  profesionalId: string;
  nombre: string;
}

/**
 * `motivo` explica por qué `cupos` viene vacío, y no es lo mismo para la
 * clienta que el salón no abra ese día a que el día esté lleno.
 */
export type MotivoSinCupos =
  | "sede_cerrada"
  | "dia_lleno"
  | "sin_horarios"
  | "fecha_pasada"
  | null;

export interface DisponibilidadApi {
  fecha: string;
  duracionMinutos: number;
  motivo: MotivoSinCupos | string;
  cupos: Array<{ hora: string }>;
}

export interface DiaApi {
  fecha: string;
  hayCupo: boolean;
}

export interface RetencionApi {
  retencionId: string;
  profesionalId: string;
  profesionalNombre: string | null;
  /** ISO. Pasado ese instante el cupo vuelve a estar libre para cualquiera. */
  expiraEn: string;
}

export interface Contacto {
  nombre: string;
  /** Sin "+": como la agenda los guarda. P. ej. `573001234567`. */
  celular: string;
  correo?: string | null;
}

export interface CitaCreada {
  citaId: string;
  [k: string]: unknown;
}

const comas = (ids: string[]): string => ids.filter(Boolean).join(",");

export const agendaApi = {
  /** Sede, abono, medios de pago, políticas y los parámetros de la agenda. */
  config: () => http.get<Record<string, unknown>>("/config"),

  catalogo: () =>
    http.get<{ servicios: ServicioApi[] }>("/catalogo").then((r) => r.servicios ?? []),

  /** Quiénes prestan TODOS esos servicios. Una lista vacía es una respuesta
   *  legítima: nadie en la sede hace ese bloque completo. */
  profesionales: (servicioIds: string[]) =>
    http.get<ProfesionalApi[]>("/profesionales", {
      params: { servicioIds: comas(servicioIds) },
    }),

  disponibilidad: (fecha: string, servicioIds: string[], profesionalId?: string | null) =>
    http.get<DisponibilidadApi>("/disponibilidad", {
      params: { fecha, servicioIds: comas(servicioIds), profesionalId: profesionalId ?? undefined },
    }),

  /** Qué días del rango tienen al menos un cupo, para pintar en gris los que
   *  no, en vez de dejar que la clienta los descubra uno por uno. */
  dias: (desde: string, hasta: string, servicioIds: string[]) =>
    http.get<DiaApi[]>("/disponibilidad/dias", {
      params: { desde, hasta, servicioIds: comas(servicioIds) },
    }),

  /**
   * Aparta el cupo mientras la clienta paga.
   *
   * No es opcional: `POST /cita` exige el `retencionId`. Y tiene sentido —
   * entre que elige la hora y sube el comprobante pasan minutos, y sin
   * retención ese cupo se lo puede llevar otra persona o la recepción de la
   * sede, que no mira esta web.
   *
   * Si no se manda `profesionalId`, el servidor elige y responde a quién le
   * tocó.
   */
  retener: (fecha: string, hora: string, servicioIds: string[], profesionalId?: string | null) =>
    http.post<RetencionApi>("/retencion", {
      fecha,
      hora,
      servicioIds,
      profesionalId: profesionalId ?? null,
    }),

  /** Suelta un cupo retenido. Se llama al volver atrás: dejarlo vencer solo
   *  son minutos en que nadie más puede tomarlo. Nunca lanza. */
  soltar: async (retencionId: string): Promise<void> => {
    try {
      await http.delete(`/retencion/${encodeURIComponent(retencionId)}`);
    } catch {
      /* La retención vence sola. Fallar acá no le sirve de nada a la clienta. */
    }
  },

  crearCita: (datos: {
    retencionId: string;
    servicioIds: string[];
    contacto: Contacto;
    notas?: string | null;
    comprobante?: string | null;
  }) => http.post<CitaCreada>("/cita", datos),
};
