import type { Campana, ConfigAgenda } from "../types";

/* =========================================================
   Lo que la agenda sabe del negocio, traído una vez

   `GET /config` ya existía y la web no lo estaba usando: el abono vivía
   quemado en `catalog.ts` como `ABONO = 50_000`. Eso era una verdad duplicada
   y además equivocada — el backend cobra un abono distinto para colorimetría
   ($90.000, porque separa insumos) y la pantalla seguía diciendo $50.000.
   Mientras el color estuvo fuera del catálogo nadie lo notaba: ninguna
   categoría con abono propio llegaba a esa pantalla.

   Se carga en la misma puerta que el catálogo, y es igual de obligatoria: sin
   ella no se sabe cuánto hay que transferir.
   ========================================================= */

let CONFIG: ConfigAgenda | null = null;

export function cargarConfigAgenda(config: ConfigAgenda): void {
  CONFIG = config;
}

/**
 * La config de la agenda.
 *
 * Lanza si todavía no llegó. Es a propósito: todo lo que la usa vive detrás de
 * la puerta que la carga, así que llegar acá sin config es un error de
 * programación, no un estado que haya que pintar. Devolver un abono inventado
 * sería peor: se ve igual de bien que el real.
 */
export function configAgenda(): ConfigAgenda {
  if (!CONFIG) throw new Error("Se usó la configuración de la agenda antes de cargarla");
  return CONFIG;
}

/**
 * Lo que se abona para apartar el cupo, según las categorías del bloque.
 *
 * El MAYOR de los que apliquen, no la suma ni el del principal, exactamente
 * como lo calcula `_abono_de` en el backend: si el bloque incluye colorimetría
 * el abono es el de colorimetría, porque el motivo del abono es el insumo. Las
 * dos cuentas tienen que dar lo mismo — es la cifra que ella transfiere.
 */
export function abono(categorias: ReadonlyArray<string | null | undefined> = []): number {
  const { porDefecto, porCategoria } = configAgenda().abono;
  const aplican = categorias
    .map((c) => (c ? porCategoria[c] : undefined))
    .filter((v): v is number => typeof v === "number");
  return aplican.length ? Math.max(...aplican) : porDefecto;
}

/** Una campaña que no existe: ninguna fecha entra y nadie ve nada. */
const SIN_CAMPANA: Campana = {
  campana: "", porcentaje: 0, desde: "", hasta: "", titulo: "", detalle: "", aviso: "",
};

/**
 * La campaña vigente: porcentaje, fechas y los textos.
 *
 * Cae a `SIN_CAMPANA` si el backend no manda el bloque. Eso pasa de verdad y
 * por unos minutos: la web y la agenda se despliegan por separado, así que
 * entre una y otra hay una ventana en la que este campo no existe todavía.
 * Sin el respaldo, `campana().porcentaje` lanza y la pantalla entera se cae
 * —no el descuento: la pantalla— por una promoción que ni siquiera había
 * empezado. Con él, en esa ventana sencillamente no hay campaña, que es lo
 * que pasaba ayer.
 *
 * `hasta` vacío hace que `cubreLaFecha` sea falso siempre: ninguna fecha
 * `YYYY-MM-DD` es menor o igual que la cadena vacía.
 */
export const campana = (): Campana => configAgenda().promocion ?? SIN_CAMPANA;

/**
 * Si una cita de ESE día entra en la ventana de la campaña.
 *
 * Compara las fechas como texto `YYYY-MM-DD`, que ordena igual que la fecha y
 * no inventa una zona horaria: `new Date("2026-11-30")` es medianoche UTC, o
 * sea el 29 por la tarde en Medellín, y ahí el último día de la promoción se
 * caía solo para quien la estuviera usando.
 *
 * Es la misma regla que aplica `promocion.cubre()` en el backend, con las
 * mismas fechas, que vienen de él. La web la repite para PINTAR; quien decide
 * el precio es el servidor.
 */
export function cubreLaFecha(fecha: string | null): boolean {
  if (!fecha) return false;
  const { desde, hasta } = campana();
  return fecha >= desde && fecha <= hasta;
}
