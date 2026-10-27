import type { Adicional, Densidad, Servicio } from "../types";
import {
  ETIQUETA_GRUPO as ETIQUETA,
  NOTA_GRUPO as NOTA,
  ORDEN_GRUPOS as ORDEN,
} from "./presentacion";

/* =========================================================
   El catálogo de la sesión

   Ya no es una lista escrita a mano: la manda la agenda en `/catalogo` y se
   guarda acá una vez, al arrancar. Todo lo que la web calcula —el valor
   exacto, el bloque que se reserva, qué adicionales caben— sigue saliendo de
   estas formas, así que las pantallas no cambiaron: cambió de dónde vienen.

   Es un módulo con estado, a propósito. La alternativa era pasar el catálogo
   por props o por contexto hasta `pricing.ts`, que son funciones puras que no
   deberían saber de React. Una sesión tiene un catálogo y se carga una vez;
   el router no deja entrar al flujo hasta que esté.
   ========================================================= */

let CATALOGO: Servicio[] = [];

/** Lo llama el arranque con lo que respondió `/catalogo`. */
export function cargarCatalogo(servicios: Servicio[]): void {
  CATALOGO = servicios;
}

/** Para pantallas que necesitan recorrerlo entero. */
export const catalogoActual = (): Servicio[] => CATALOGO;

/** Los grupos que de verdad tienen servicios, en el orden del menú. Un grupo
 *  vacío —porque la sede no presta nada de esa familia— no se pinta. */
export const gruposConServicios = (): string[] =>
  ORDEN.filter((g) => CATALOGO.some((s) => s.grupo === g));

export const ORDEN_GRUPOS = ORDEN;
export const ETIQUETA_GRUPO = ETIQUETA;
export const NOTA_GRUPO = NOTA;

/** La pista de cada densidad, para que la clienta se reconozca sin saber el término */
export const PISTA_DENSIDAD: Record<Densidad, [es: string, en: string]> = {
  "Baja": ["Se ve el cuero cabelludo con facilidad", "You can easily see the scalp"],
  "Media": ["Se ve solo si abres el cabello", "Only visible if you part it"],
  "Alta": ["Casi no se ve el cuero cabelludo", "The scalp is barely visible"],
  "Extra alta": ["Volumen muy abundante, la mano no lo abarca", "Very full, your hand can't hold it all"],
};

/**
 * Indicativo, bandera y cuántos dígitos esperamos.
 *
 * El largo no es decorativo: es lo que valida el formulario, y es por país
 * porque un celular español de 9 dígitos no está incompleto.
 */
export const PAISES: Array<[codigo: string, bandera: string, digitos: number]> = [
  ["+57", "🇨🇴", 10], ["+1", "🇺🇸", 10], ["+34", "🇪🇸", 9], ["+39", "🇮🇹", 10],
  ["+52", "🇲🇽", 10], ["+58", "🇻🇪", 10], ["+51", "🇵🇪", 9], ["+56", "🇨🇱", 9],
  ["+593", "🇪🇨", 9], ["+507", "🇵🇦", 8],
];

/** Lo que se abona para apartar el cupo, y se descuenta del total */
export const ABONO = 50_000;

/**
 * Datos de pago de la sede.
 *
 * `null` no es "vacío", es "esta forma de pago no se ofrece": la fila
 * desaparece de la pantalla del abono. Una forma de pago que la clienta ve y
 * no puede usar la deja parada en el paso que confirma la cita.
 */
export const PAGOS: Record<"cuenta" | "llave" | "link", string | null> = {
  cuenta: "36000000929",
  llave: "@rfsuramericana",
  link: null,
};

export const WHATSAPP_SEDE = "573000000000";

/* ---------- Búsquedas sobre el catálogo ---------- */

export const buscarServicio = (id: string | null): Servicio | undefined =>
  CATALOGO.find((s) => s.id === id);

export const serviciosDelGrupo = (grupo: string): Servicio[] =>
  CATALOGO.filter((s) => s.grupo === grupo).sort((a, b) => a.orden - b.orden);

/** Las densidades que ese servicio ofrece. Solo las de su matriz: ofrecer una
 *  que no tiene fila daría un precio que no existe. */
export const densidadesDe = (s: Servicio): Densidad[] => (s.matriz ?? []).map((r) => r.d);

/**
 * Si esa plasticidad se presta para ese servicio.
 *
 * "Definición sencilla" tiene toda la columna `pb` en N/A porque no aplica a
 * plasticidades bajas. La pantalla desactiva esa opción en vez de dejar
 * elegirla y mostrar un precio vacío.
 */
export const plasticidadDisponible = (s: Servicio, p: "pa" | "pb"): boolean =>
  (s.matriz ?? []).some((r) => {
    const v = p === "pa" ? r.pa : r.pb;
    return Boolean(v) && String(v).toUpperCase() !== "N/A";
  });

export const adicionalesDe = (s: Servicio | undefined): Adicional[] => s?.adicionales ?? [];

/* ---------- Del id de la agenda a lo que la web entiende ---------- */

/**
 * Qué es, en términos de la web, un `servicio_id` que mandó la agenda.
 *
 * Hace falta para el historial: la agenda guarda las citas con sus ids, y para
 * ofrecer "repetir" hay que saber que `SV-21649` es el Full con densidad alta
 * y plasticidad P.A — servicio, diagnóstico y todo.
 */
export interface Ubicacion {
  servicio: Servicio;
  dens: Densidad | null;
  plast: "pa" | "pb" | null;
}

export function ubicarServicioId(id: string): Ubicacion | null {
  for (const s of CATALOGO) {
    if (s.servicioId === id) return { servicio: s, dens: null, plast: null };
    for (const fila of s.matriz ?? []) {
      if (fila.idA === id) return { servicio: s, dens: fila.d, plast: "pa" };
      if (fila.idB === id) return { servicio: s, dens: fila.d, plast: "pb" };
    }
  }
  return null;
}

/** El nombre del adicional con ese id, o null si ese id no es un adicional. */
export function ubicarAdicional(id: string): string | null {
  for (const s of CATALOGO) {
    const a = (s.adicionales ?? []).find((x) => x.servicioId === id);
    if (a) return a.n;
  }
  return null;
}
