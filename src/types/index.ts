/* =========================================================
   Tipos de dominio del autoagendamiento

   El catálogo es la fuente de todo: de él salen el precio, el tiempo, si hay
   que preguntar el diagnóstico y qué adicionales se ofrecen. Ver
   src/data/catalog.ts.
   ========================================================= */

export type Lang = "es" | "en";

/** Las densidades que el catálogo usa como escalones de precio */
export type Densidad = "Baja" | "Media" | "Alta" | "Extra alta";

/**
 * Plasticidad: `pa` = el rizo se forma fácil al definirlo · `pb` = le cuesta.
 *
 * Son dos servicios distintos en la agenda, no una preferencia: un COMPLETO
 * MEDIA P.A son 2h y P.B son 2h 30min, con precios distintos.
 */
export type Plasticidad = "pa" | "pb";

/** Una fila de la matriz: el mismo servicio a una densidad, por plasticidad */
export interface FilaMatriz {
  d: Densidad;
  /** Precio con plasticidad alta. "N/A" = esa combinación no se presta */
  pa: string;
  pb?: string;
  /** Duración con plasticidad alta */
  ta?: string;
  tb?: string;
  /**
   * El `servicio_id` de la agenda para cada celda, p. ej. `SV-21649`.
   *
   * Cada combinación densidad x plasticidad ES un servicio distinto en la
   * agenda, con su propio precio y su propia duración. Sin este id la cita no
   * se puede crear: el backend no sabe qué es "el Full de Alejandra".
   */
  idA?: string;
  idB?: string;
}

export interface Adicional {
  n: string;
  p?: string;
  /** "+30 min", "No agrega tiempo" */
  t?: string;
  /** Su `servicio_id` en la agenda. Un adicional también es un servicio. */
  servicioId?: string;
}

export interface Servicio {
  id: string;
  /** La familia del catálogo de la agenda, p. ej. `COMPLETO`. Es la llave que
   *  une lo que la agenda sabe (precios, tiempos, ids) con el texto que vive
   *  en el frontend (descripción, qué incluye, en qué grupo va). */
  familia?: string;
  /** El `servicio_id` de los que NO tienen matriz. Los que la tienen lo llevan
   *  por celda, porque cada combinación es un servicio distinto. */
  servicioId?: string;
  grupo: string;
  /** Orden dentro del grupo */
  orden: number;
  nombre: string;
  /** Rango del catálogo, p. ej. "$145.000 – $210.000" */
  precio?: string;
  /** Duración fija, para los servicios sin matriz */
  tiempo?: string;
  desc?: string;
  /** Lo que incluye, separado por comas */
  incluye?: string;
  nota?: string;
  /**
   * Los escalones por densidad y plasticidad. Un servicio CON matriz pide
   * diagnóstico; uno sin ella tiene precio y tiempo fijos.
   */
  matriz?: FilaMatriz[];
  adicionales?: Adicional[];
}

/** Precio y tiempo ya resueltos para un diagnóstico concreto */
export interface Resuelto {
  precio: string;
  /** Precio numérico exacto; null si solo hay rango */
  n: number | null;
  mins: number | null;
  /** true = salió de la matriz con el diagnóstico, no del rango */
  exacto: boolean;
  /** El id que va a la agenda. null mientras falte el diagnóstico. */
  servicioId?: string | null;
}

/** El total del bloque: servicio principal + adicionales */
export interface Total extends Resuelto {
  tiempo: string;
  /** Los nombres que componen el bloque, para "Full + Ozonoterapia" */
  labels: string[];
  /** Los `servicio_id` del bloque entero —principal y adicionales— en el
   *  orden en que se cobran. Es lo que viaja a `POST /cita`. */
  servicioIds: string[];
}

/* ---------- La reserva en curso ---------- */

export type Modo = "cliente" | "nueva" | "agente";

export interface Reserva {
  modo: Modo | null;
  /** Por dónde se identificó */
  via: "tel" | "mail";
  /** Indicativo con "+", p. ej. "+57" */
  pais: string;
  tel: string;
  correo: string;
  nombre: string;
  svc: string | null;
  dens: Densidad | null;
  plast: Plasticidad | null;
  /** Nombres de los adicionales elegidos, como vienen del catálogo */
  extras: string[];
  /** El nombre, para mostrar. null = la asigna el salón. */
  estilista: string | null;
  /** Su `profesional_id` en la agenda. Es lo que viaja al backend; el nombre
   *  es cosmético y puede repetirse entre dos personas. */
  estilistaId: string | null;
  /**
   * El cupo apartado mientras la clienta paga, y cuándo vence.
   *
   * `POST /cita` lo exige. Se guarda en la reserva y no en el estado de una
   * pantalla porque sobrevive a ir y volver entre el resumen y el abono.
   */
  retencionId: string | null;
  retencionExpira: string | null;
  /** YYYY-MM-DD */
  fecha: string | null;
  /** "10:30 am" */
  hora: string | null;
  /** true = viene de repetir un servicio del historial */
  repite: boolean;
  comprobante: { nombre: string; url: string } | null;
}

/* ---------- La clienta que vuelve ---------- */

export interface ServicioPasado {
  /** id del catálogo */
  svc: string;
  /** Ya formateada: "12 de agosto de 2026" */
  fecha: string;
  extras: string[];
}

export interface Historial {
  nombre: string;
  /** Puede venir vacío: la agenda no siempre sabe quién la atendió. */
  estilista: string;
  /** Ya formateada, o "" si no hay. Sale de `ultimaVisita` de la agenda. */
  ultimaVisita: string;
  dens: Densidad | null;
  plast: Plasticidad | null;
  correo: string;
  servicios: ServicioPasado[];
}
