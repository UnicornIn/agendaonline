import type { Densidad, Plasticidad } from "../types";

import densidadBaja from "../assets/diagnostico/densidad-baja.webp";
import densidadMedia from "../assets/diagnostico/densidad-media.webp";
import densidadAlta from "../assets/diagnostico/densidad-alta.webp";
import plasticidadPa from "../assets/diagnostico/plasticidad-pa.webp";
import plasticidadPb from "../assets/diagnostico/plasticidad-pb.webp";

/**
 * Las fotos con las que la clienta se autodiagnostica.
 *
 * ## Por qué viven en el repo y no en S3
 *
 * Son parte de la interfaz, no contenido: no cambian por clienta, no las sube
 * nadie y no sirven de nada sin la pantalla que las rodea. Importándolas, Vite
 * les pone un hash en el nombre, así que el CDN las puede cachear para siempre
 * y el día que se reemplace una foto la URL cambia sola —sin purgar caché y sin
 * que a alguien le quede la vieja—. Y si el archivo falta, no compila: el error
 * sale acá y no como un cuadro roto en el celular de una clienta.
 *
 * S3 es para lo que sí varía por clienta y llega después del build: el
 * comprobante del abono. Meter estas cinco ahí sería pagar una petición de red
 * y un punto de falla externo por algo que ya viaja en el `dist`.
 *
 * ## Por qué son 480x640
 *
 * La tarjeta mide unos 190 px de ancho. Los originales venían en 1024 px y
 * pesaban 820 KB entre las cinco; así pesan 216 KB. Esta pantalla es el
 * segundo paso del agendamiento y casi siempre se abre con datos móviles.
 */

/** No todas tienen foto: "Extra alta" todavía no llegó y cae al marcador. */
export const FOTO_DENSIDAD: Partial<Record<Densidad, string>> = {
  "Baja": densidadBaja,
  "Media": densidadMedia,
  "Alta": densidadAlta,
};

export const FOTO_PLASTICIDAD: Record<Plasticidad, string> = {
  pa: plasticidadPa,
  pb: plasticidadPb,
};
