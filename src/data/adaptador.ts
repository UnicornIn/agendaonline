import type { ServicioApi } from "../api/agenda";
import { NOMBRE_ADICIONAL, PRESENTACION } from "./presentacion";
import type { Adicional, Densidad, FilaMatriz, Servicio } from "../types";

/* =========================================================
   De la lista plana del backend al catálogo que pintan las pantallas

   `/catalogo` manda 77 filas sueltas, una por cada combinación de densidad y
   plasticidad, porque así es como la agenda las guarda: cada combinación ES un
   servicio distinto, con su propio precio, su propia duración y su propio id.

   La web no las muestra así. Muestra "Servicio Full" y pregunta el
   diagnóstico. Este archivo hace esa vuelta: agrupa por familia y arma la
   matriz, guardando en cada celda el id que la agenda va a necesitar después.

   El viaje de ida y vuelta importa: la clienta elige un servicio y un
   diagnóstico, y de eso tiene que salir un `SV-xxxxx` exacto. Si se pierde el
   id, la cita no se puede crear.
   ========================================================= */

const ORDEN_DENSIDAD: Densidad[] = ["Baja", "Media", "Alta", "Extra alta"];

/** 145000 -> "$145.000". El resto de la app lee precios como texto. */
const money = (n: number): string => "$" + n.toLocaleString("es-CO");

/** 150 -> "2h 30min". Igual que `hhmm` de pricing, pero acá no se puede
 *  importar: pricing depende del catálogo y el catálogo de esto. */
function duracion(mins: number): string {
  const h = Math.floor(mins / 60);
  const r = mins % 60;
  if (!h) return `${r} min`;
  return r ? `${h}h ${r}min` : `${h}h`;
}

function normalizarDensidad(valor: string | null): Densidad | null {
  if (!valor) return null;
  const limpio = valor.trim().toLowerCase();
  return ORDEN_DENSIDAD.find((d) => d.toLowerCase() === limpio) ?? null;
}

/**
 * Las filas de la matriz de una familia.
 *
 * Una celda sin servicio en el backend queda en "N/A", que es exactamente lo
 * que `plasticidadDisponible` y `resolver` ya saben interpretar: esa
 * combinación no se presta. Definición sencilla tiene toda la columna P.B así.
 */
function armarMatriz(filas: ServicioApi[]): FilaMatriz[] {
  const porDensidad = new Map<Densidad, ServicioApi[]>();
  for (const f of filas) {
    const d = normalizarDensidad(f.ejes.densidad);
    if (!d) continue;
    porDensidad.set(d, [...(porDensidad.get(d) ?? []), f]);
  }

  return ORDEN_DENSIDAD.filter((d) => porDensidad.has(d)).map((d) => {
    const items = porDensidad.get(d)!;
    // El backend nombra el eje por lo que ES el rizo —"alta" para P.A, el que
    // se forma fácil, y "baja" para P.B— mientras que acá se llaman pa/pb.
    // Son los mismos dos servicios con dos vocabularios; la traducción vive en
    // esta línea y en ninguna otra.
    //
    // Una familia sin eje —el backend manda null— tiene una sola fila por
    // densidad y vale para las dos. Se pone en P.A y P.B queda en N/A, que es
    // lo que hace que la pantalla de plasticidad se salte sola.
    const pa = items.find((x) => x.ejes.plasticidad === "alta") ?? items.find((x) => !x.ejes.plasticidad);
    const pb = items.find((x) => x.ejes.plasticidad === "baja");
    return {
      d,
      pa: pa ? money(pa.precio) : "N/A",
      pb: pb ? money(pb.precio) : "N/A",
      ta: pa ? duracion(pa.duracionMinutos) : undefined,
      tb: pb ? duracion(pb.duracionMinutos) : undefined,
      idA: pa?.servicioId,
      idB: pb?.servicioId,
    };
  });
}

/** El rango que se muestra en el menú, de la celda más barata a la más cara. */
function rango(filas: ServicioApi[]): string {
  const precios = filas.map((f) => f.precio).filter((n) => n > 0);
  if (!precios.length) return "";
  const min = Math.min(...precios);
  const max = Math.max(...precios);
  return min === max ? money(min) : `${money(min)} - ${money(max)}`;
}

/**
 * El catálogo que pintan las pantallas, armado con lo que mandó la agenda.
 *
 * Una familia sin entrada en `PRESENTACION` no entra: saldría sin descripción
 * y sin grupo, suelta al final del menú, y se vería como un error de la
 * página. Queda avisada en consola para que alguien la agregue.
 */
export function construirCatalogo(servicios: ServicioApi[]): Servicio[] {
  const porFamilia = new Map<string, ServicioApi[]>();
  for (const s of servicios) {
    const f = (s.ejes.familia ?? "").trim().toUpperCase();
    if (!f) continue;
    porFamilia.set(f, [...(porFamilia.get(f) ?? []), s]);
  }

  const adicionalDe = (familia: string): Adicional | null => {
    const filas = porFamilia.get(familia);
    if (!filas?.length) return null;
    // Un adicional nunca tiene matriz: es una sola fila.
    const f = filas[0];
    return {
      n: NOMBRE_ADICIONAL[familia] ?? f.nombre,
      p: money(f.precio),
      t: f.duracionMinutos > 0 ? `+${f.duracionMinutos} min` : "No agrega tiempo",
      servicioId: f.servicioId,
    };
  };

  const salida: Servicio[] = [];
  const sinPresentacion: string[] = [];

  for (const [familia, filas] of porFamilia) {
    const p = PRESENTACION[familia];
    if (!p) {
      sinPresentacion.push(familia);
      continue;
    }

    const tieneMatriz = filas.some((f) => f.ejes.densidad);
    const matriz = tieneMatriz ? armarMatriz(filas) : undefined;
    const adicionales = (p.adicionales ?? [])
      .map(adicionalDe)
      .filter((a): a is Adicional => a !== null);

    salida.push({
      id: p.id,
      familia,
      grupo: p.grupo,
      orden: p.orden,
      nombre: p.nombre,
      desc: p.desc,
      incluye: p.incluye,
      nota: p.nota,
      precio: tieneMatriz ? rango(filas) : money(filas[0].precio),
      tiempo: tieneMatriz ? undefined : duracion(filas[0].duracionMinutos),
      servicioId: tieneMatriz ? undefined : filas[0].servicioId,
      matriz: matriz?.length ? matriz : undefined,
      adicionales: adicionales.length ? adicionales : undefined,
    });
  }

  // Los adicionales también son familias del backend y no tienen que estar en
  // PRESENTACION, así que no se avisa de ellos.
  const usadasComoAdicional = new Set(
    Object.values(PRESENTACION).flatMap((p) => p.adicionales ?? [])
  );
  const huerfanas = sinPresentacion.filter((f) => !usadasComoAdicional.has(f));
  if (huerfanas.length) {
    console.warn(
      "[catálogo] La agenda ofrece servicios que la web no sabe presentar y no se van a mostrar:",
      huerfanas.join(", "),
      "\nAgrégalos a src/data/presentacion.ts"
    );
  }

  return salida.sort((a, b) => a.orden - b.orden);
}
