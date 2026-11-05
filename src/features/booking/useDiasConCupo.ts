import { useCallback, useEffect, useRef, useState } from "react";
import { agendaApi } from "../../api/agenda";
import { aISO, hoy } from "../../lib/dates";

/**
 * Qué días tienen al menos un cupo, para cualquier rango que se pida.
 *
 * El selector pregunta por dos cosas distintas —la tira de los próximos días
 * y el mes que la clienta esté mirando en el calendario—, y las dos se
 * superponen. Preguntar cada una por su lado pediría tres veces los mismos
 * días cada vez que alguien abre y cierra el calendario.
 *
 * Por eso el rango no se pide tal cual: se parte en TRAMOS FIJOS de dieciséis
 * días, siempre los mismos, contados desde la misma referencia. Dos rangos
 * que se pisan caen en los mismos tramos, así que el segundo no pide nada —
 * la respuesta del primero ya está guardada. Es lo que permite pasar meses de
 * ida y vuelta sin gastar una sola llamada de más.
 */

/** Lo que acepta `GET /disponibilidad/dias` de una sola vez, y de paso el
 *  tamaño del tramo: pedir menos serían más llamadas para los mismos días. */
const TRAMO = 16;

const DIA_MS = 86_400_000;

/**
 * El día como un número entero.
 *
 * Se cuenta sobre UTC a propósito aunque la fecha sea local: son fechas de
 * pared, no instantes, y en hora local el día del cambio de horario dura 23
 * o 25 horas y la división se corre un día entero.
 */
const numeroDeDia = (d: Date): number =>
  Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DIA_MS);

const fechaDeNumero = (n: number): Date => {
  const u = new Date(n * DIA_MS);
  return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate());
};

export interface DiasConCupo {
  /** ISO → si ese día tiene algo libre. Que FALTE la clave no es lo mismo que
   *  `false`: es que todavía no se sabe, y un día que no se sabe se deja
   *  tocar. Apagarlo sería apagar días que sí tienen cupo. */
  cupoPorDia: Record<string, boolean>;
  /** Pide el rango que haga falta. Llamarla de más no cuesta: lo ya pedido no
   *  se vuelve a pedir, así que puede ir dentro de un efecto. */
  pedir: (desde: Date, hasta: Date) => void;
}

export function useDiasConCupo(idsClave: string): DiasConCupo {
  const [cupoPorDia, setCupoPorDia] = useState<Record<string, boolean>>({});
  const pedidos = useRef<Set<number>>(new Set());
  const idsGuardados = useRef(idsClave);

  // Otro bloque de servicios dura otra cosa, y un día que le cabía a un corte
  // no le cabe a una colorimetría: lo guardado deja de valer.
  //
  // Se compara contra lo guardado en vez de limpiar cada vez que corre el
  // efecto. En desarrollo StrictMode monta, desmonta y vuelve a montar, y un
  // borrón incondicional tiraba la memoria entre las dos pasadas: los mismos
  // dos tramos se pedían dos veces.
  useEffect(() => {
    if (idsGuardados.current === idsClave) return;
    idsGuardados.current = idsClave;
    pedidos.current = new Set();
    setCupoPorDia({});
  }, [idsClave]);

  const pedir = useCallback(
    (desde: Date, hasta: Date) => {
      if (!idsClave) return;
      const ids = idsClave.split(",");
      // Lo que ya pasó no se agenda, así que no se pregunta. Al abrir el mes
      // en curso, la primera semana cae entera en el pasado y sin esto son
      // una o dos llamadas enteras para días que el calendario ya pinta
      // apagados por su cuenta.
      const arranque = desde < hoy() ? hoy() : desde;
      if (hasta < arranque) return;

      const primero = Math.floor(numeroDeDia(arranque) / TRAMO);
      const ultimo = Math.floor(numeroDeDia(hasta) / TRAMO);

      for (let tramo = primero; tramo <= ultimo; tramo++) {
        if (pedidos.current.has(tramo)) continue;
        pedidos.current.add(tramo);

        const inicio = fechaDeNumero(tramo * TRAMO);
        const fin = fechaDeNumero(tramo * TRAMO + TRAMO - 1);

        agendaApi
          .dias(aISO(inicio), aISO(fin), ids)
          .then((lista) =>
            setCupoPorDia((prev) => {
              const sig = { ...prev };
              for (const d of lista) sig[d.fecha] = d.hayCupo;
              return sig;
            })
          )
          .catch(() => {
            // Si falla, ningún día de ese tramo se pinta en gris y el tramo
            // queda libre para volver a pedirse. Es peor dejarlos todos
            // apagados: la clienta no podría ni intentar.
            pedidos.current.delete(tramo);
          });
      }
    },
    [idsClave]
  );

  return { cupoPorDia, pedir };
}
