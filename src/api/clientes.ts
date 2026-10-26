import type { Historial } from "../types";

/* =========================================================
   El historial de la clienta

   Hoy sale de este archivo. Cuando el backend de la agenda exponga el módulo
   de autoagendamiento, `buscarHistorial` pasa a llamarlo y nada más cambia:
   las pantallas ya le preguntan solo a esta función, y ya la tratan como algo
   que tarda y que puede fallar.

   Lo que el backend NO va a poder hacer, y por eso conviene dejarlo escrito
   acá: devolver el historial a cambio de un celular tecleado y nada más. Un
   endpoint así es un oráculo para averiguar quién es clienta de Rizos y qué se
   hace en el pelo, probando números. La salida es exigir que concuerde algo
   más —el nombre, o un pase firmado que viaje en el enlace de confirmación—.
   ========================================================= */

const DEMO: Record<string, Historial> = {
  "573104567890": {
    nombre: "Laura Restrepo", estilista: "Marcela", visitas: 7,
    dens: "Alta", plast: "pa", correo: "laura@mail.com",
    servicios: [
      { svc: "full", fecha: "12 de agosto de 2026", extras: ["Ozonoterapia"] },
      { svc: "definicion", fecha: "3 de junio de 2026", extras: [] },
      { svc: "m-corte", fecha: "28 de marzo de 2026", extras: ["Lavado", "Secado"] },
    ],
  },
  "573209876543": {
    nombre: "Daniela Ochoa", estilista: "Tatiana", visitas: 3,
    dens: "Media", plast: "pb", correo: "dani@mail.com",
    servicios: [
      { svc: "definicion", fecha: "2 de septiembre de 2026", extras: [] },
      { svc: "t-completo", fecha: "14 de mayo de 2026", extras: [] },
    ],
  },
  "573151234567": {
    nombre: "Andrés Mejía", estilista: "Julián", visitas: 12,
    dens: null, plast: null, correo: "andres@mail.com",
    servicios: [
      { svc: "h-corte-def", fecha: "28 de septiembre de 2026", extras: ["Detox"] },
      { svc: "h-corte", fecha: "30 de agosto de 2026", extras: ["Barba y cejas"] },
    ],
  },
};

const espera = (ms = 420) => new Promise<void>((r) => setTimeout(r, ms));

/** `+57` + `3104567890` -> `573104567890`, que es como la agenda los guarda */
export const claveTelefono = (pais: string, tel: string): string =>
  pais.replace("+", "") + tel.replace(/\D/g, "");

/** El historial de quien se identificó, o null si no hay ninguno con esos datos. */
export async function buscarHistorial(
  datos: { pais: string; tel: string } | { correo: string }
): Promise<Historial | null> {
  await espera();
  if ("correo" in datos) {
    const correo = datos.correo.trim().toLowerCase();
    return Object.values(DEMO).find((h) => h.correo === correo) ?? null;
  }
  return DEMO[claveTelefono(datos.pais, datos.tel)] ?? null;
}

/**
 * Lo mismo, desde la ruta con agente, donde la clienta escribe lo que quiera
 * en un solo campo. Un texto con siete dígitos o más se trata como teléfono y
 * se compara por los últimos diez: en el chat nadie escribe el indicativo.
 */
export async function buscarPorTexto(valor: string): Promise<Historial | null> {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length >= 7) return buscarHistorial({ pais: "+57", tel: digitos.slice(-10) });
  return buscarHistorial({ correo: valor });
}
