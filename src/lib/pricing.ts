import { adicionalesDe, buscarServicio } from "../data/catalog";
import { abono, campana, cubreLaFecha } from "../data/configAgenda";
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

  // `plast` puede faltar legítimamente: una familia sin ese eje —el color—
  // nunca lo pregunta, y exigirlo acá la dejaba resolviendo por el camino del
  // rango, o sea sin `servicioId`, o sea sin poder agendarse.
  if (s.matriz && dens && (plast || s.sinPlasticidad)) {
    const fila = s.matriz.find((r) => r.d === dens);
    if (fila) {
      // Sin eje, la única columna viva es P.A. Ver `armarMatriz`.
      const esPb = plast === "pb";
      const precio = esPb ? fila.pb : fila.pa;
      const tiempo = esPb ? fila.tb : fila.ta;
      const servicioId = esPb ? fila.idB : fila.idA;
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
    // `aNumero` y no `null`: un servicio sin matriz tiene UN precio, no un
    // rango, y si acá queda null los adicionales no se le suman —el botón de
    // la pantalla de adicionales mostraba el valor pelado del servicio— y
    // `saldo` no sabe decir cuánto queda por pagar. Para los que sí tienen
    // matriz, `s.precio` es el rango y `aNumero` sigue devolviendo null.
    n: aNumero(s.precio),
    mins: aMinutos(s.tiempo),
    exacto: false,
    servicioId: s.matriz ? null : (s.servicioId ?? null),
  };
}

type ParaCobrar = Pick<Reserva, "svc" | "dens" | "plast" | "extras">;

/** Lo mismo más lo que hace falta para saber si le toca el descuento: si está
 *  invitada y qué día es la cita. */
type ParaCobrarConFecha = ParaCobrar & Pick<Reserva, "promocion" | "fecha">;

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

/**
 * Lo que se abona por ESTE bloque.
 *
 * Se mira el principal y cada adicional elegido, porque el abono sale de la
 * categoría y un adicional puede traer una más cara que el principal: una
 * nivelación de color sobre un servicio que no es de color sube el abono a
 * $90.000, igual que lo sube el backend al crear la cita.
 *
 * El abono NO se rebaja con la promoción: aparta el cupo, no es una fracción
 * del servicio. Lo que baja es el saldo.
 */
export function abonoDe(reserva: ParaCobrar): number {
  const s = buscarServicio(reserva.svc);
  const elegidos = adicionalesDe(s).filter((a) => reserva.extras.includes(a.n));
  return abono([s?.categoria, ...elegidos.map((a) => a.categoria)]);
}

/**
 * El 20% de la campaña aplicado a este bloque, si corresponde.
 *
 * Dos condiciones, las mismas que mira el backend al cobrar: que esté
 * invitada y que la CITA caiga en la ventana. Mientras no haya fecha elegida
 * `aplica` es falso y se muestra el precio normal — que es lo correcto, porque
 * todavía no se sabe si va a haber descuento.
 *
 * Esto PINTA; no decide. El precio que se cobra lo calcula el servidor en
 * `POST /cita` con las mismas dos condiciones. Si los dos no coincidieran, el
 * que manda es el servidor, y por eso el porcentaje y las fechas vienen de él.
 */
export function descuento(reserva: ParaCobrarConFecha): {
  aplica: boolean;
  porcentaje: number;
  /** El total ya rebajado, o null si no hay cifra exacta todavía. */
  total: number | null;
  /** Lo que se ahorra, para poder decirlo. */
  ahorro: number | null;
} {
  const { porcentaje } = campana();
  const t = calcularTotal(reserva);
  const aplica = Boolean(reserva.promocion) && cubreLaFecha(reserva.fecha);
  if (!aplica || t.n == null) {
    return { aplica, porcentaje, total: t.n, ahorro: null };
  }
  // El mismo redondeo que `promocion.con_descuento` del backend, para que la
  // cifra de la pantalla y la de la cita sean la misma.
  const ahorro = Math.round((t.n * porcentaje) / 100);
  return { aplica, porcentaje, total: t.n - ahorro, ahorro };
}

/** El total que de verdad se va a cobrar: con descuento si le toca. */
export const totalACobrar = (reserva: ParaCobrarConFecha): number | null =>
  descuento(reserva).total;

/** Lo que queda por pagar en el salón después del abono */
export function saldo(reserva: ParaCobrarConFecha, textoSiNoExacto: string): string {
  const total = totalACobrar(reserva);
  return total != null ? money(total - abonoDe(reserva)) : textoSiNoExacto;
}
