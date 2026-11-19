import type { Lang, SedePublica } from "../types";

/* =========================================================
   La sede de esta visita

   Hasta el 2026-11-19 la sede no existía en el frontend: la fijaba el
   servidor en `AUTOAGENDAMIENTO_SEDE_ID` y la web ni la nombraba. Con ocho
   sedes abiertas, cada una tiene su propia URL —`citas.rizosfelices.co/
   sabaneta`— y el primer segmento de esa URL es lo que decide todo lo demás:
   qué catálogo se pide, a qué agenda se aparta y a qué cuenta se transfiere
   el abono.

   Lo que se guarda acá es el APODO, no el `sede_id`. El backend no expone el
   id en ninguna respuesta, a propósito: afuera una sede es su apodo, y lo que
   el navegador no tiene tampoco lo puede mandar de vuelta.

   Se fija UNA vez, al arrancar, contra la lista que da `GET /sedes`. Que la
   validación esté antes de montar el router y no dentro de cada llamada es lo
   que hace que `bajoSede` pueda lanzar en vez de devolver algo a medias: para
   cuando se pinta la primera pantalla, la sede ya es buena.
   ========================================================= */

let SEDE: SedePublica | null = null;

export function fijarSede(sede: SedePublica): void {
  SEDE = sede;
}

/**
 * La sede de esta visita.
 *
 * Lanza si todavía no se fijó. Es a propósito y es la misma regla que
 * `configAgenda()`: todo lo que la usa vive detrás de la puerta que la carga,
 * así que llegar acá sin sede es un error de programación, no un estado que
 * haya que pintar. Devolver una sede por defecto sería peor —Suramericana se
 * ve igual de bien que Cali— y el error aparecería cuadrando caja.
 */
export function sedeActiva(): SedePublica {
  if (!SEDE) throw new Error("Se usó la sede antes de fijarla");
  return SEDE;
}

/**
 * La ruta de un endpoint, colgada de la sede.
 *
 * `/catalogo` → `/sabaneta/catalogo`. Todo el módulo público cuelga del apodo
 * menos `GET /sedes`, que es justamente el que lo elige; ese se pide con la
 * ruta tal cual desde `src/api/sedes.ts`.
 */
export function bajoSede(ruta: string): string {
  const apodo = sedeActiva().slug;
  return `/${encodeURIComponent(apodo)}${ruta.startsWith("/") ? ruta : "/" + ruta}`;
}

/**
 * Cómo se nombra la sede en pantalla: "Sede Cali Norte · Cali".
 *
 * La ciudad puede faltar —hay sedes sin ese dato cargado— y entonces no se
 * pinta el separador: "Sede El Restrepo · " con el punto colgando dice menos
 * que "Sede El Restrepo".
 *
 * El "Sede" solo va en español, como estaba escrito a mano antes de que esto
 * existiera: en inglés la línea era "Suramericana · Medellín", sin prefijo.
 */
export function etiquetaDeSede(lang: Lang): string {
  const { nombre, ciudad } = sedeActiva();
  const base = lang === "es" ? `Sede ${nombre}` : nombre;
  return ciudad ? `${base} · ${ciudad}` : base;
}
