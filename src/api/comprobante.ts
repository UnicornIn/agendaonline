import { config } from "../config";
import { http } from "./httpClient";

/* =========================================================
   El comprobante del abono

   Sube con URL firmada: el navegador le pide permiso al backend y manda la
   foto DIRECTO a S3. Tres razones, y ninguna es de comodidad:

   1. La foto no pasa por el API. Una imagen de celular son 3–8 MB; con varias
      clientas subiendo a la vez, el servidor que además escribe citas se queda
      sin memoria por mover archivos que solo va a reenviar.
   2. El bucket se queda PRIVADO. Un comprobante tiene el nombre de la
      clienta, su banco y el monto; un objeto público es una fuga en cuanto el
      enlace se filtra, y los enlaces de S3 se filtran — se pegan en WhatsApp,
      quedan en el historial, se indexan.
   3. El backend solo guarda la `clave`. Para mostrar la imagen en la agenda
      firma una URL de lectura corta en ese momento. Así el acceso caduca solo
      y se puede revocar cambiando la política, sin tocar las citas.

   La subida es de un solo uso y de un solo archivo: la firma lleva el tipo y
   el tamaño que el backend autorizó, así que no sirve para subir otra cosa.
   ========================================================= */

/** Lo máximo que aceptamos. Una foto de celular rara vez pasa de 8 MB. */
export const MAX_BYTES = 10 * 1024 * 1024;
export const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export interface PermisoDeSubida {
  /** La URL firmada a la que va el PUT */
  url: string;
  /** La ruta dentro del bucket. Es lo único que el backend guarda en la cita. */
  clave: string;
  /** Cabeceras que la firma exige; mandar otras invalida el PUT */
  cabeceras?: Record<string, string>;
}

export interface CitaConfirmada {
  citaId: string;
  estado: string;
}

/** Qué tiene de malo el archivo, o null si sirve */
export function revisarArchivo(f: File): "tipo" | "peso" | null {
  // Algunos Android mandan los HEIC con el tipo vacío: se decide por extensión
  // antes que rechazar una foto buena.
  const tipoOk = TIPOS.includes(f.type) || /\.(jpe?g|png|webp|heic)$/i.test(f.name);
  if (!tipoOk) return "tipo";
  if (f.size > MAX_BYTES) return "peso";
  return null;
}

/* ---------- mientras no haya AWS ---------- */

const espera = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const mock = {
  async permiso(f: File): Promise<PermisoDeSubida> {
    await espera(250);
    return { url: "mock://s3", clave: `comprobantes/demo/${Date.now()}-${f.name}` };
  },
  async subir(): Promise<void> {
    await espera(900);
  },
  async confirmar(): Promise<CitaConfirmada> {
    await espera(500);
    return { citaId: "RF-" + Date.now().toString(36).toUpperCase(), estado: "confirmada" };
  },
};

/* ---------- el camino real ---------- */

export const comprobanteApi = {
  /** Pide permiso para subir UNA foto con ese tipo y ese tamaño */
  permiso: (f: File): Promise<PermisoDeSubida> =>
    config.useMocks
      ? mock.permiso(f)
      : http.post<PermisoDeSubida>("/comprobante/firma", {
          tipo: f.type || "image/jpeg",
          bytes: f.size,
        }),

  /**
   * Manda la foto a S3. No pasa por `httpClient` a propósito: ese cliente le
   * pone `Accept: application/json` y el prefijo del API, y S3 rechaza la
   * firma si las cabeceras no son exactamente las que se firmaron.
   */
  async subir(permiso: PermisoDeSubida, f: File): Promise<void> {
    if (config.useMocks) return mock.subir();
    const res = await fetch(permiso.url, {
      method: "PUT",
      body: f,
      headers: { "Content-Type": f.type || "image/jpeg", ...permiso.cabeceras },
    });
    if (!res.ok) throw new Error(`S3 respondió ${res.status}`);
  },

  /**
   * Cierra la cita con el comprobante ya en el bucket.
   *
   * El orden importa: primero la foto, después la cita. Al revés quedaría una
   * cita confirmada sin comprobante si la subida falla, y eso la sede lo lee
   * como una clienta que no pagó.
   */
  confirmar: (clave: string, datos: Record<string, unknown>): Promise<CitaConfirmada> =>
    config.useMocks
      ? mock.confirmar()
      : http.post<CitaConfirmada>("/cita", { ...datos, comprobante: clave }),
};
