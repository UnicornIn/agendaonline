import type { Lang } from "../types";

/* =========================================================
   Cómo se presenta cada familia del catálogo

   La agenda sabe qué servicios hay, cuánto valen, cuánto duran y quién los
   presta. Lo que NO sabe es cómo contarlos: la descripción, el "qué incluye",
   las notas, en qué grupo del menú van y qué adicionales se ofrecen con cada
   uno. Eso no está en ninguna base y por eso vive acá.

   La llave es la FAMILIA que manda el backend en `ejes.familia`, no el nombre
   ni el id. El nombre cambia cuando operación lo reescribe y el id cambia por
   cada combinación de densidad y plasticidad; la familia es lo único estable.

   Una familia que el backend mande y que no esté acá NO se ofrece en la web.
   Es a propósito: un servicio nuevo aparece en la agenda sin descripción ni
   grupo, y mostrarlo suelto al final del menú se ve como un error. Queda
   registrado en consola para que alguien lo agregue.
   ========================================================= */

export interface Presentacion {
  /** El id corto que usan las URLs y la reserva. Estable, lo elegimos acá. */
  id: string;
  grupo: string;
  /** Orden dentro del grupo */
  orden: number;
  /** Cómo se llama en la web, que no siempre es como se llama en la agenda */
  nombre: string;
  desc?: string;
  incluye?: string;
  nota?: string;
  /** Las FAMILIAS que se ofrecen como adicional de este servicio, en orden.
   *  Su precio y su duración salen del backend, igual que los principales. */
  adicionales?: string[];
}

/** Cómo se muestra un adicional, cuando su nombre de agenda no se entiende. */
export const NOMBRE_ADICIONAL: Record<string, string> = {
  "DETOX": "Detox",
  "OZONOTERAPIA": "Ozonoterapia",
  "OZONOTERAPIA COMBO": "Ozonoterapia (incluye lavado y definición sencilla)",
  "MASCARILLA COMBO": "Mascarilla (incluye lavado)",
  "ASESORIA DE COLOR": "Asesoría de color",
  "BARBA Y CEJAS": "Barba y cejas",
  "LAVADO": "Lavado",
  "SECADO": "Secado",
  "PEINADO SENCILLO": "Peinado sencillo",
  "CORTE COMBO": "Corte",
  "DEFINICION SENCILLA COMBO": "Definición sencilla (incluye lavado)",
};

export const PRESENTACION: Record<string, Presentacion> = {
  "COMPLETO": {
    id: "full", grupo: "Servicio Full", orden: 10, nombre: "Servicio Full",
    desc: "El servicio más completo de la casa: resuelve el cabello entero en una sola cita.",
    incluye: "Corte, lavado, Tratamiento HNH, evaluación y asesoría completa que se envía por correo, definición detallada, secado 100%",
    nota: "*no aplica para cabellos en transición.",
    adicionales: ["OZONOTERAPIA", "ASESORIA DE COLOR", "DETOX"],
  },
  "SOLO CORTE": {
    id: "m-corte", grupo: "Mujeres", orden: 10, nombre: "Solo corte",
    desc: "Corte de forma o puntas.",
    incluye: "No incluye lavado, ni definición, ni secado",
    nota: "No aplica para cabello afro ni para plasticidad baja: en esos casos el corte va dentro de un servicio completo.",
    adicionales: ["LAVADO", "DEFINICION SENCILLA COMBO", "SECADO", "MASCARILLA COMBO", "OZONOTERAPIA COMBO", "ASESORIA DE COLOR", "DETOX"],
  },
  "CORTE + DEFINICION SENCILLA": {
    id: "m-corte-def", grupo: "Mujeres", orden: 20, nombre: "Corte + definición sencilla",
    desc: "Cualquier corte + definición sencilla.",
    incluye: "Corte + definición sencilla, secado al 70%",
    nota: "*no aplica para afro ni plasticidades bajas.",
    adicionales: ["OZONOTERAPIA", "MASCARILLA COMBO", "DETOX", "ASESORIA DE COLOR"],
  },
  "DEFINICION SENCILLA": {
    id: "def-sencilla", grupo: "Definición", orden: 10, nombre: "Definición sencilla",
    desc: "La definición rápida, sobre cabello que llega listo.",
    incluye: "Definición, secado al 80%",
    nota: "*No aplica para plasticidades bajas ni cabello afro. Debes traer el cabello limpio y desenredado.",
    adicionales: ["DETOX"],
  },
  "SOLO DEFINICION": {
    id: "definicion", grupo: "Definición", orden: 20, nombre: "Definición detallada",
    desc: "Definición detallada sin corte.",
    incluye: "Lavado, definición detallada, secado al 100%",
    adicionales: ["OZONOTERAPIA", "PEINADO SENCILLO", "ASESORIA DE COLOR", "DETOX"],
  },
  "TRATAMIENTO HNH + VAPOR OZONO": {
    id: "hnh", grupo: "Tratamiento", orden: 10, nombre: "Tratamiento HNH + vapor ozono",
    desc: "La ruta de recuperación para un cabello maltratado.",
    incluye: "Diagnóstico de daño, lavado, tratamiento, definición sencilla, secado al 50%",
    adicionales: ["CORTE COMBO", "ASESORIA DE COLOR", "DETOX"],
  },
  "TRANSICION GRAN CORTE": {
    id: "t-gran-corte", grupo: "Transición", orden: 10,
    nombre: "Gran corte + definición + tratamiento",
    desc: "Para dejar la transición atrás de una vez.",
    incluye: "Corte, lavado, Tratamiento HNH, evaluación y asesoría completa que se envía por correo, definición detallada, secado 100%",
    adicionales: ["DETOX"],
  },
  "TRANSICION DOBLE TEXTURA": {
    id: "t-completo", grupo: "Transición", orden: 20, nombre: "Transición con doble textura",
    desc: "Acompaña el rizo mientras crece, con las dos texturas trabajadas.",
    incluye: "Corte, lavado, mascarilla, definición detallada en la parte rizada, definición detallada en la parte lisa, asesoría, secado",
    adicionales: ["DETOX"],
  },
  "CORTE HOMBRE": {
    id: "h-corte", grupo: "Hombres", orden: 10, nombre: "Corte hombre",
    desc: "Solo corte, con tijera o máquina.",
    incluye: "Corte de cabello y laterales (base)",
    nota: "*No aplica para cabellos afro ni cabello largo.",
    adicionales: ["BARBA Y CEJAS", "DEFINICION SENCILLA COMBO", "MASCARILLA COMBO", "OZONOTERAPIA COMBO", "DETOX"],
  },
  "CORTE HOMBRE + DEFINICION SENCILLA": {
    id: "h-corte-def", grupo: "Hombres", orden: 20, nombre: "Corte hombre + definición sencilla",
    desc: "El corte básico de hombre con definición sencilla, barba y cejas.",
    incluye: "Corte, lavado, definición sencilla, secado al 70%, barba y cejas",
    nota: "*no aplica para afro ni plasticidades bajas.",
    adicionales: ["MASCARILLA COMBO", "OZONOTERAPIA", "ASESORIA DE COLOR", "DETOX"],
  },
  "COMPLETO HOMBRE": {
    id: "h-full", grupo: "Hombres", orden: 30, nombre: "Servicio Full hombre",
    desc: "El servicio completo para hombre. Incluye barba y cejas.",
    incluye: "Corte, lavado, Tratamiento HNH, evaluación y asesoría completa que se envía por correo, definición detallada, secado 100%, barba y cejas",
    nota: "*puede incluir máquina. *no aplica para cabellos en transición.",
    adicionales: ["OZONOTERAPIA", "ASESORIA DE COLOR", "DETOX"],
  },
  "NINO 0 A 8": {
    id: "n-0-8", grupo: "Niños", orden: 10, nombre: "Niños · 0 a 8 años",
    desc: "Corte + refrescado con definición sencilla.",
    incluye: "Corte + refrescado con definición sencilla",
  },
  "NINO 9 EN ADELANTE": {
    id: "n-9", grupo: "Niños", orden: 30, nombre: "Niños · 9 años en adelante",
    desc: "Corte + definición sencilla.",
    incluye: "Lavado, corte + definición sencilla + secado al 70%",
  },
  "PEINADO SENCILLO": {
    id: "p-sencillo", grupo: "Peinados", orden: 10, nombre: "Peinado sencillo",
    desc: "Recogido lateral o trenza lateral.", incluye: "No incluye definición",
  },
  "PEINADO DE FIESTA": {
    id: "p-fiesta", grupo: "Peinados", orden: 20, nombre: "Peinado de fiesta",
    desc: "Semirecogido o recogido.", nota: "*no incluye lavado ni definición.",
  },
  "MAQUILLAJE SOCIAL": {
    id: "mq-social", grupo: "Maquillaje", orden: 10, nombre: "Maquillaje social",
    desc: "Para eventos.",
  },
  "MAQUILLAJE DE NOVIA": {
    id: "mq-novias", grupo: "Maquillaje", orden: 20, nombre: "Maquillaje de novia",
    desc: "Para novias.", incluye: "Prueba de maquillaje previa",
  },
  "UNAS CONVENCIONAL MANOS": { id: "u-conv-manos", grupo: "Uñas", orden: 10, nombre: "Convencional · manos" },
  "UNAS CONVENCIONAL PIES": { id: "u-conv-pies", grupo: "Uñas", orden: 20, nombre: "Convencional · pies" },
  "UNAS SEMIPERMANENTE MANOS": { id: "u-semi-manos", grupo: "Uñas", orden: 30, nombre: "Semipermanente · manos" },
  "UNAS SEMIPERMANENTE PIES": { id: "u-semi-pies", grupo: "Uñas", orden: 40, nombre: "Semipermanente · pies" },
  "UNAS FORRADO MANOS": { id: "u-forr-manos", grupo: "Uñas", orden: 50, nombre: "Forrado · manos" },
  "UNAS FORRADO PIES": { id: "u-forr-pies", grupo: "Uñas", orden: 60, nombre: "Forrado · pies" },
  "UNAS PRESS ON MANOS": { id: "u-press-manos", grupo: "Uñas", orden: 70, nombre: "Press on · manos" },
};

/** Una aclaración que aplica a todo un grupo, no a un servicio suelto */
export const NOTA_GRUPO: Record<string, string> = {
  "Niños": "En todos los servicios de niños la definición es sencilla.",
};

/** El orden del menú. El Full va primero porque es el que la casa recomienda. */
export const ORDEN_GRUPOS = [
  "Servicio Full", "Mujeres", "Definición", "Tratamiento", "Transición",
  "Hombres", "Niños", "Peinados", "Maquillaje", "Uñas",
] as const;

/** Cómo se llama cada grupo en la pantalla, que no es como se llama por dentro */
export const ETIQUETA_GRUPO: Record<Lang, Record<string, string>> = {
  es: {
    "Servicio Full": "El completo", "Mujeres": "Corte mujer", "Definición": "Definición",
    "Tratamiento": "Tratamiento", "Transición": "Transición", "Hombres": "Hombres",
    "Niños": "Niños", "Peinados": "Peinados", "Maquillaje": "Maquillaje", "Uñas": "Uñas",
  },
  en: {
    "Servicio Full": "The full service", "Mujeres": "Women · haircut", "Definición": "Definition",
    "Tratamiento": "Treatment", "Transición": "Transition", "Hombres": "Men", "Niños": "Kids",
    "Peinados": "Hairstyling", "Maquillaje": "Makeup", "Uñas": "Nails",
  },
};
