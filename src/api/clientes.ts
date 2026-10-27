import { http } from "./httpClient";
import { config } from "../config";
import { ubicarAdicional, ubicarServicioId } from "../data/catalog";
import type { Densidad, Historial, Plasticidad, ServicioPasado } from "../types";

/* =========================================================
   El historial de la clienta

   Sale de `POST /clienta/historial`, el único endpoint del módulo que
   devuelve datos de una persona.

   Pide nombre Y celular, y eso no es burocracia. Un endpoint que entregue el
   historial a cambio de un celular tecleado y nada más es un oráculo: con una
   lista de números cualquiera averigua quién es clienta de Rizos y qué se
   hace en el pelo. Exigir que el nombre concuerde con el guardado cierra eso,
   y por eso la pantalla de identificación pide las dos cosas.

   El backend responde igual —`reconocida: false`— para "no está en la base" y
   para "está pero el nombre no concuerda". Distinguirlas volvería a abrir lo
   mismo por la puerta de atrás.
   ========================================================= */

/** Un bloque frecuente tal como lo manda el backend. */
interface BloqueApi {
  servicioIds: string[];
  /** Si viene con algo, el bloque no se repite: se escoge de esta lista. */
  opciones?: string[];
  etiqueta: string;
  veces: number;
  /** ISO */
  ultimaVez: string | null;
  profesionalId: string | null;
  profesionalNombre: string | null;
}

interface HistorialApi {
  reconocida: boolean;
  nombre: string | null;
  ultimaVisita: string | null;
  diagnostico: { densidad: string | null; plasticidad: string | null };
  frecuentes: BloqueApi[];
}

const DENSIDADES: Densidad[] = ["Baja", "Media", "Alta", "Extra alta"];

function aDensidad(valor: string | null): Densidad | null {
  if (!valor) return null;
  const limpio = valor.trim().toLowerCase();
  return DENSIDADES.find((d) => d.toLowerCase() === limpio) ?? null;
}

/** El backend dice "alta"/"baja" por lo que ES el rizo; acá son pa/pb. */
const aPlasticidad = (valor: string | null): Plasticidad | null =>
  valor === "alta" ? "pa" : valor === "baja" ? "pb" : null;

/** "2026-08-12" -> "12 de agosto de 2026". Las pantallas la muestran tal cual. */
function fechaBonita(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Un bloque de la agenda en términos del catálogo de la web.
 *
 * El backend manda los `servicio_id` de la cita; acá se busca cuál es el
 * principal —el que existe en el menú— y los demás quedan como adicionales.
 * Un bloque cuyo principal ya no está en el catálogo se descarta: ofrecer
 * "repetir" algo que la sede dejó de prestar termina en una cita que nadie
 * puede atender.
 */
/** "SERVICIO DE UÑAS" -> "Servicio de uñas". En mayúsculas parece un grito. */
const comoTitulo = (texto: string): string => {
  const limpio = texto.trim().toLowerCase();
  return limpio ? limpio[0].toUpperCase() + limpio.slice(1) : "";
};

function aServicioPasado(bloque: BloqueApi): ServicioPasado | null {
  // El bloque que no dice CUÁL: se muestra con su nombre viejo y lleva al
  // grupo donde están las opciones de hoy.
  if (bloque.opciones?.length) {
    const ubicado = bloque.opciones.map(ubicarServicioId).find((u) => u !== null);
    if (!ubicado) return null;
    return {
      svc: "",
      fecha: fechaBonita(bloque.ultimaVez),
      extras: [],
      grupo: ubicado.servicio.grupo,
      nombre: comoTitulo(bloque.etiqueta),
    };
  }

  let principal: ReturnType<typeof ubicarServicioId> = null;
  const extras: string[] = [];

  for (const id of bloque.servicioIds) {
    const ubicado = ubicarServicioId(id);
    if (ubicado && !principal) {
      principal = ubicado;
      continue;
    }
    const adicional = ubicarAdicional(id);
    if (adicional) extras.push(adicional);
  }

  if (!principal) return null;
  return { svc: principal.servicio.id, fecha: fechaBonita(bloque.ultimaVez), extras };
}

function aHistorial(api: HistorialApi, correo: string): Historial | null {
  if (!api.reconocida) return null;
  const servicios = api.frecuentes
    .map(aServicioPasado)
    .filter((s): s is ServicioPasado => s !== null);

  return {
    nombre: api.nombre ?? "",
    estilista: api.frecuentes.find((b) => b.profesionalNombre)?.profesionalNombre ?? "",
    // La fecha que manda la agenda, no una cuenta armada acá. Esta línea
    // sumaba las `veces` de los bloques y se mostraba como "N visitas con
    // nosotros": eso no son sus visitas, son las veces que repitió los tres
    // bloques que la web alcanza a ofrecer, y no cuadraba con la agenda.
    ultimaVisita: fechaBonita(api.ultimaVisita),
    dens: aDensidad(api.diagnostico?.densidad ?? null),
    plast: aPlasticidad(api.diagnostico?.plasticidad ?? null),
    correo,
    servicios,
  };
}

/* ---------- los datos de muestra, solo para desarrollo ---------- */

const espera = (ms = 420) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Una clienta de mentira para trabajar sin backend.
 *
 * Va detrás de `import.meta.env.DEV` y no solo de `useMocks` para que Vite la
 * borre del build: `useMocks` se evalúa al arrancar, así que el objeto viajaba
 * igual en el bundle público. Es una ficha con nombre y correo —falsos, pero
 * con pinta de reales— y no tiene nada que hacer en un archivo que cualquiera
 * puede abrir.
 */
const DEMO: Record<string, Historial> = import.meta.env.DEV
  ? {
      "573104567890": {
        nombre: "Laura Restrepo", estilista: "Marcela",
        ultimaVisita: "12 de agosto de 2026",
        dens: "Alta", plast: "pa", correo: "laura@mail.com",
        servicios: [
          { svc: "full", fecha: "12 de agosto de 2026", extras: ["Ozonoterapia"] },
          { svc: "definicion", fecha: "3 de junio de 2026", extras: [] },
        ],
      },
    }
  : {};

/** `+57` + `3104567890` -> `573104567890`, que es como la agenda los guarda */
export const claveTelefono = (pais: string, tel: string): string =>
  pais.replace("+", "") + tel.replace(/\D/g, "");

/**
 * El nombre es obligatorio; el contacto es celular O correo.
 *
 * El nombre no se puede negociar: es lo que impide que esto sea un oráculo
 * para averiguar, probando datos, quién es clienta de Rizos. El contacto sí,
 * porque la sede registró a unas con teléfono y a otras con correo, y pedir
 * ambos deja afuera justo a las de siempre.
 */
export interface DatosDeBusqueda {
  nombre: string;
  /** Indicativo con "+". Solo se usa si viene `tel`. */
  pais?: string;
  tel?: string;
  correo?: string;
}

/** El historial de quien se identificó, o null si no hay ninguno con esos datos. */
export async function buscarHistorial(datos: DatosDeBusqueda): Promise<Historial | null> {
  const tel = (datos.tel ?? "").trim();
  const celular = tel ? claveTelefono(datos.pais ?? "+57", tel) : null;
  const correo = datos.correo?.trim().toLowerCase() || null;

  if (config.useMocks) {
    await espera();
    const h = celular ? DEMO[celular] : Object.values(DEMO).find((x) => x.correo === correo);
    return h && h.nombre.toLowerCase().includes(datos.nombre.trim().toLowerCase().split(" ")[0])
      ? h
      : null;
  }

  const api = await http.post<HistorialApi>("/clienta/historial", {
    nombre: datos.nombre.trim(),
    celular,
    correo,
  });
  return aHistorial(api, correo ?? "");
}
