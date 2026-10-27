import { ABONO, adicionalesDe, buscarServicio } from "../data/catalog";
import type { Densidad, Plasticidad, Reserva, Resuelto, Servicio, Total } from "../types";

/* =========================================================
   Precio y tiempo

   Funciones puras: reciben el catálogo ya resuelto y la reserva, y devuelven
   números. No saben de pantallas ni de idioma, y por eso el mismo cálculo
   sirve para el menú, el detalle, la confirmación y la ruta con agente.

   La regla que ordena todo: con diagnóstico el valor es EXACTO y sale de la
   matriz; sin diagnóstico es un rango y se dice que es aproximado. Mostrar un
   rango como si fuera el valor final es lo que termina en una discusión en la
   caja del salón.
   ========================================================= */

export const money = (n: number): string => "$" + n.toLocaleString("es-CO");

/** "$145.000" -> 145000. Devuelve null cuando es un rango o un texto. */
export function aNumero(precio?: string): number | null {
  const limpio = String(precio ?? "").replace(/\./g, "");
  // Un rango ("$50.000 - $90.000") trae dos números: no es un valor, es un
  // intervalo, y sumarlo a un total daría una cifra que nadie va a cobrar.
  if ((limpio.match(/\d+/g) ?? []).length !== 1) return null;
  const m = limpio.match(/\d+/);
  return m ? Number(m[0]) : null;
}

/** "2h 30min" -> 150. "+45 min" -> 45. "No agrega tiempo" -> null. */
export function aMinutos(texto?: string): number | null {
  if (!texto) return null;
  const s = String(texto).toLowerCase();
  const h = s.match(/(\d+)\s*h/)?.[1];
  const m = s.match(/(\d+)\s*m/)?.[1];
  const total = Number(h ?? 0) * 60 + Number(m ?? 0);
  return total || null;
}

export function hhmm(mins: number): string {
  const h = Math.floor(mins / 60);
  const r = mins % 60;
  // Varios servicios bajan de la hora: "0h 40min" se lee como un error de la
  // página, no como cuarenta minutos.
  if (!h) return `${r} min`;
  return r ? `${h}h ${r}min` : `${h}h`;
}

/**
 * El precio y el tiempo de un servicio para un diagnóstico dado.
 *
 * Sin diagnóstico —o con uno que su matriz no cubre— cae al rango del
 * catálogo y marca `exacto: false`, que es lo que las pantallas usan para
 * decir "duración aproximada" en vez de "tu valor".
 */
export function resolver(
  s: Servicio | undefined,
  dens: Densidad | null,
  plast: Plasticidad | null
): Resuelto {
  if (!s) return { precio: "", n: null, mins: null, exacto: false, servicioId: null };

  if (s.matriz && dens && plast) {
    const fila = s.matriz.find((r) => r.d === dens);
    if (fila) {
      const precio = plast === "pa" ? fila.pa : fila.pb;
      const tiempo = plast === "pa" ? fila.ta : fila.tb;
      const servicioId = plast === "pa" ? fila.idA : fila.idB;
      // "N/A" es una combinación que la casa no presta, no un precio.
      if (precio && precio.toUpperCase() !== "N/A") {
        return {
          precio,
          n: aNumero(precio),
          mins: aMinutos(tiempo),
          exacto: true,
          servicioId: servicioId ?? null,
        };
      }
    }
  }
  // Sin diagnóstico no hay id: la agenda no sabe qué es "el Full" a secas, y
  // cada densidad y plasticidad es un servicio suyo distinto. Los servicios
  // sin matriz sí lo traen, porque ahí no hay nada que preguntar.
  return {
    precio: s.precio ?? "",
    n: null,
    mins: aMinutos(s.tiempo),
    exacto: false,
    servicioId: s.matriz ? null : (s.servicioId ?? null),
  };
}

type ParaCobrar = Pick<Reserva, "svc" | "dens" | "plast" | "extras">;

/**
 * El total del bloque: el servicio principal más cada adicional.
 *
 * Un adicional con precio en rango vuelve `exacto` falso para todo el bloque.
 * Es deliberado: el total de una suma donde un sumando es un intervalo
 * también es un intervalo, y presentarlo como cifra cerrada sería inventarlo.
 */
export function calcularTotal(reserva: ParaCobrar): Total {
  const s = buscarServicio(reserva.svc);
  const base = resolver(s, reserva.dens, reserva.plast);

  let n = base.n;
  let mins = base.mins ?? 0;
  let exacto = base.exacto;
  const labels = s ? [s.nombre] : [];
  // El principal va primero: es el que manda en la duración del bloque.
  const servicioIds = base.servicioId ? [base.servicioId] : [];

  for (const nombre of reserva.extras) {
    const a = adicionalesDe(s).find((x) => x.n === nombre);
    if (!a) continue;
    labels.push(a.n);
    if (a.servicioId) servicioIds.push(a.servicioId);
    const precio = aNumero(a.p);
    if (precio != null && n != null) n += precio;
    else if (precio == null) exacto = false;
    mins += aMinutos(a.t) ?? 0;
  }

  return {
    n, mins, exacto,
    precio: n != null ? money(n) : base.precio || "—",
    tiempo: mins ? hhmm(mins) : "",
    labels,
    servicioIds,
    servicioId: base.servicioId ?? null,
  };
}

/** Lo que queda por pagar en el salón después del abono */
export function saldo(reserva: ParaCobrar, textoSiNoExacto: string): string {
  const t = calcularTotal(reserva);
  return t.n != null ? money(t.n - ABONO) : textoSiNoExacto;
}
