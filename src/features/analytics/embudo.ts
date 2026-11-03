import { PATHS } from "../../router/paths";
import { calcularTotal } from "../../lib/pricing";
import type { DatosEvento, EventoMeta } from "../../lib/pixel";
import type { Reserva } from "../../types";

/* =========================================================
   El embudo: qué pantalla es qué evento de Meta

   Una sola tabla, al lado de PATHS. Cambiar qué se mide —o medir un paso
   nuevo— es tocar este archivo y nada más: las pantallas no saben que existe
   un píxel, igual que no saben que existe un router.

   Los nombres son los estándar de Meta. Importa que lo sean: los eventos
   estándar se pueden usar para optimizar campañas y construir públicos; uno
   inventado hay que registrarlo a mano y no sirve para optimizar.
   ========================================================= */

export interface Disparo {
  evento: EventoMeta;
  datos: DatosEvento;
  /** Con clave, el evento sale una sola vez (refresh y botón atrás no lo repiten) */
  clave?: string;
}

/** Lo que vale y qué es, sin un solo dato personal */
function contenido(reserva: Reserva): DatosEvento {
  const total = calcularTotal(reserva);
  return {
    content_name: total.labels.join(" + ") || undefined,
    content_category: reserva.svc ?? undefined,
    // Los `servicio_id` de la agenda: es el identificador que comparten la web,
    // la agenda y la factura, así que un público de Meta y un informe de la
    // sede hablan del mismo servicio.
    content_ids: total.servicioIds.length ? total.servicioIds : undefined,
    content_type: "product",
    // Solo cuando el valor es exacto. Con diagnóstico a medias el precio es un
    // rango, y mandar la punta baja de un rango como `value` le enseña a Meta
    // un ticket promedio que el salón no cobra.
    value: total.n ?? undefined,
    currency: "COP",
  };
}

/**
 * El evento que le toca a una pantalla, si le toca alguno.
 *
 * El PageView va aparte: ese sí es en todas.
 */
export function disparoDe(pathname: string, reserva: Reserva, citaId?: string): Disparo | null {
  switch (pathname) {
    // Vio un servicio con su precio: es el "me interesa esto".
    case PATHS.detail:
      return { evento: "ViewContent", datos: contenido(reserva) };

    // Está escogiendo día y hora: empezó a cerrar.
    case PATHS.date:
      return { evento: "InitiateCheckout", datos: contenido(reserva) };

    // Para llegar acá dejó nombre y celular, y el cupo quedó apartado. Es un
    // lead de verdad: la sede ya puede llamarla aunque no termine de pagar.
    case PATHS.deposit:
      return { evento: "Lead", datos: contenido(reserva) };

    // La conversión: cita confirmada con comprobante arriba.
    //
    // `Schedule` y no `Purchase` porque lo que ocurrió es una cita agendada;
    // la plata entra cuando la sede verifica el abono. Si en el administrador
    // de anuncios prefieren optimizar por `Purchase`, se cambia el nombre acá
    // —uno solo de los dos—: contar los dos infla la cuenta de conversiones.
    //
    // El `value` sigue siendo el total del servicio, no el abono: es lo que
    // vale esa clienta para el salón, y es la cifra con la que se mide si la
    // pauta se paga sola.
    case PATHS.done:
      return {
        evento: "Schedule",
        datos: contenido(reserva),
        clave: `schedule:${citaId ?? "sin-id"}`,
      };

    default:
      return null;
  }
}
