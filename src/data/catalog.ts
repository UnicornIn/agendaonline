import type { Adicional, Densidad, Lang, Servicio } from "../types";

/* =========================================================
   El catálogo maestro de servicios

   Es la única fuente de precios, tiempos y de qué se puede agendar. Cuando el
   backend de la agenda exponga estos mismos servicios, este archivo se
   reemplaza por la respuesta de `/catalogo` sin que cambie nada más: todo lo
   que la web calcula —el valor exacto, el bloque que se reserva, qué
   adicionales caben— sale de estas formas y no de las pantallas.

   Un servicio CON matriz pide diagnóstico (densidad y plasticidad) porque su
   precio y su duración dependen de él. Uno sin matriz tiene precio y tiempo
   fijos y se agenda derecho.
   ========================================================= */

export const CATALOGO: Servicio[] = [
  {
    id: "def-sencilla", grupo: "Definición", orden: 10,
    nombre: "Definición sencilla", precio: "$50.000 - $90.000", tiempo: "1h 15min",
    desc: "La definición rápida, sobre cabello que llega listo.",
    incluye: "Definición, secado al 80%",
    nota: "*No aplica para plasticidades bajas ni cabello afro. Debes traer el cabello limpio y desenredado.",
    matriz: [
      { d: "Baja", pa: "$50.000", pb: "N/A", ta: "1h" },
      { d: "Media", pa: "$65.000", pb: "N/A", ta: "1h" },
      { d: "Alta", pa: "$75.000", pb: "N/A", ta: "1h 15min" },
      { d: "Extra alta", pa: "$90.000", pb: "N/A", ta: "1h 15min" },
    ],
    adicionales: [{ n: "Detox", p: "$50.000", t: "+30 min" }],
  },
  {
    id: "definicion", grupo: "Definición", orden: 20,
    nombre: "Definición detallada", precio: "$110.000 - $195.000",
    desc: "Definición detallada sin corte.",
    incluye: "Lavado, definición detallada, secado al 100%",
    matriz: [
      { d: "Baja", pa: "$110.000", pb: "$146.000", ta: "1h", tb: "1h 30min" },
      { d: "Media", pa: "$130.000", pb: "$160.000", ta: "1h 30min", tb: "2h" },
      { d: "Alta", pa: "$152.000", pb: "$172.000", ta: "1h 30min", tb: "2h 30min" },
      { d: "Extra alta", pa: "$182.000", pb: "$195.000", ta: "2h 20min", tb: "3h" },
    ],
    adicionales: [
      { n: "Ozonoterapia", p: "$69.000", t: "+30 min" },
      { n: "Peinado sencillo", p: "$30.000 - $50.000", t: "+15 min" },
      { n: "Asesoría de color", p: "$39.000", t: "No agrega tiempo" },
      { n: "Detox", p: "$50.000", t: "+30 min" },
    ],
  },
  {
    id: "full", grupo: "Servicio Full", orden: 10,
    nombre: "Servicio Full", precio: "$121.000 – $210.000", tiempo: "1h 30min a 3h 30min",
    desc: "El servicio más completo de la casa: resuelve el cabello entero en una sola cita.",
    incluye: "Corte, lavado, Tratamiento HNH, evaluación y asesoría completa que se envía por correo, definición detallada, secado 100%",
    nota: "*no aplica para cabellos en transición.",
    matriz: [
      { d: "Baja", pa: "$121.000", pb: "$161.000", ta: "1h 30min", tb: "1h 30min" },
      { d: "Media", pa: "$145.000", pb: "$175.000", ta: "2h", tb: "2h 30min" },
      { d: "Alta", pa: "$167.000", pb: "$187.000", ta: "2h 30min", tb: "3h" },
      { d: "Extra alta", pa: "$197.000", pb: "$210.000", ta: "3h", tb: "3h 30min" },
    ],
    adicionales: [
      { n: "Ozonoterapia", p: "$69.000", t: "+30 min" },
      { n: "Asesoría de color", p: "$39.000", t: "No agrega tiempo" },
      { n: "Detox", p: "$50.000", t: "+30 min" },
    ],
  },
  {
    id: "h-corte", grupo: "Hombres", orden: 10,
    nombre: "Corte hombre", precio: "$60.000", tiempo: "60 min",
    desc: "Solo corte, con tijera o máquina.",
    incluye: "Corte de cabello y laterales (base)",
    nota: "*No aplica para cabellos afro ni cabello largo.",
    adicionales: [
      { n: "Barba y cejas", p: "$20.000", t: "+30 min" },
      { n: "Definición sencilla (incluye lavado)", p: "$50.000", t: "No suma tiempo" },
      { n: "Mascarilla (incluye lavado)", p: "$30.000", t: "+15 min" },
      { n: "Ozonoterapia (incluye lavado y definición sencilla)", p: "$69.000", t: "+45 min" },
      { n: "Detox", p: "$50.000", t: "+30 min" },
    ],
  },
  {
    id: "h-corte-def", grupo: "Hombres", orden: 20,
    nombre: "Corte + definición sencilla", precio: "$110.000", tiempo: "90 min",
    desc: "El corte básico de hombre con definición sencilla, barba y cejas.",
    incluye: "Corte, lavado, definición sencilla, secado al 70%, barba y cejas",
    nota: "*no aplica para afro ni plasticidades bajas.",
    adicionales: [
      { n: "Mascarilla", p: "$30.000", t: "+15 min" },
      { n: "Ozonoterapia", p: "$69.000", t: "+45 min" },
      { n: "Asesoría de color", p: "$39.000", t: "+45 min" },
      { n: "Detox", p: "$50.000", t: "+30 min" },
    ],
  },
  {
    id: "h-full", grupo: "Hombres", orden: 30,
    nombre: "Servicio Full hombre", precio: "$121.000 – $210.000", tiempo: "1h 30min a 3h 30min",
    desc: "El servicio completo para hombre. Incluye barba y cejas.",
    incluye: "Corte, lavado, Tratamiento HNH, evaluación y asesoría completa que se envía por correo, definición detallada, secado 100%, barba y cejas",
    nota: "*puede incluir máquina. *no aplica para cabellos en transición.",
    matriz: [
      { d: "Baja", pa: "$121.000", pb: "$161.000", ta: "1h 30min", tb: "1h 30min" },
      { d: "Media", pa: "$145.000", pb: "$175.000", ta: "2h", tb: "2h 30min" },
      { d: "Alta", pa: "$167.000", pb: "$187.000", ta: "2h 30min", tb: "3h" },
      { d: "Extra alta", pa: "$197.000", pb: "$210.000", ta: "3h", tb: "3h 30min" },
    ],
    adicionales: [
      { n: "Ozonoterapia", p: "$69.000", t: "+45 min" },
      { n: "Asesoría de color", p: "$39.000", t: "No agrega tiempo" },
      { n: "Detox", p: "$50.000", t: "+30 min" },
    ],
  },
  {
    id: "m-corte", grupo: "Mujeres", orden: 10,
    nombre: "Solo corte", precio: "$80.000", tiempo: "30 min",
    desc: "Corte de forma o puntas.",
    incluye: "No incluye lavado, ni definición, ni secado",
    nota: "No aplica para cabello afro ni para plasticidad baja: en esos casos el corte va dentro de un servicio completo.",
    adicionales: [
      { n: "Lavado", p: "$20.000", t: "+20 min" },
      { n: "Definición sencilla", p: "$30.000", t: "+20 min" },
      { n: "Secado", p: "$10.000", t: "+20 min" },
      { n: "Mascarilla", p: "$30.000", t: "+15 min" },
      { n: "Ozonoterapia", p: "$100.000", t: "+45 min" },
      { n: "Asesoría de color", p: "$39.000", t: "No agrega tiempo" },
      { n: "Detox", p: "$50.000", t: "+30 min" },
    ],
  },
  {
    id: "m-corte-def", grupo: "Mujeres", orden: 20,
    nombre: "Corte + definición sencilla", precio: "$110.000", tiempo: "90 min",
    desc: "Cualquier corte + definición sencilla.",
    incluye: "Corte + definición sencilla, secado al 70%",
    nota: "*no aplica para afro ni plasticidades bajas.",
    adicionales: [
      { n: "Ozonoterapia", p: "$69.000", t: "+45 min" },
      { n: "Mascarilla", p: "$30.000", t: "+15 min" },
      { n: "Detox", p: "$50.000", t: "+30 min" },
      { n: "Asesoría de color", p: "$39.000", t: "No agrega tiempo" },
    ],
  },
  {
    id: "hnh", grupo: "Tratamiento", orden: 10,
    nombre: "Tratamiento HNH + vapor ozono", precio: "$149.000", tiempo: "1h",
    desc: "La ruta de recuperación para un cabello maltratado.",
    incluye: "Diagnóstico de daño, lavado, tratamiento, definición sencilla, secado al 50%",
    adicionales: [
      { n: "Corte", p: "$30.000", t: "+30 min" },
      { n: "Asesoría de color", p: "$39.000", t: "No agrega tiempo" },
      { n: "Detox", p: "$50.000", t: "+30 min" },
    ],
  },
  {
    id: "t-gran-corte", grupo: "Transición", orden: 10,
    nombre: "Gran corte + definición + tratamiento", precio: "$145.000 - $210.000",
    desc: "Para dejar la transición atrás de una vez.",
    incluye: "Corte, lavado, Tratamiento HNH, evaluación y asesoría completa que se envía por correo, definición detallada, secado 100%",
    matriz: [
      { d: "Baja", pa: "$121.000", pb: "$161.000", ta: "1h 30min", tb: "1h 30min" },
      { d: "Media", pa: "$145.000", pb: "$175.000", ta: "2h", tb: "2h 30min" },
      { d: "Alta", pa: "$167.000", pb: "$187.000", ta: "2h 30min", tb: "3h" },
      { d: "Extra alta", pa: "$197.000", pb: "$210.000", ta: "3h", tb: "3h 30min" },
    ],
    adicionales: [{ n: "Detox", p: "$50.000", t: "+30 min" }],
  },
  {
    id: "t-completo", grupo: "Transición", orden: 20,
    nombre: "Transición con doble textura", precio: "$195.000 - $260.000",
    desc: "Acompaña el rizo mientras crece, con las dos texturas trabajadas.",
    incluye: "Corte, lavado, mascarilla, definición detallada en la parte rizada, definición detallada en la parte lisa, asesoría, secado",
    matriz: [
      { d: "Media", pa: "$195.000", pb: "$225.000", ta: "2h 30min", tb: "3h" },
      { d: "Alta", pa: "$217.000", pb: "$237.000", ta: "2h 30min", tb: "3h 30min" },
      { d: "Extra alta", pa: "$247.000", pb: "$260.000", ta: "3h 30min", tb: "4h" },
    ],
    adicionales: [{ n: "Detox", p: "$50.000", t: "+30 min" }],
  },
  {
    id: "n-0-8", grupo: "Niños", orden: 10,
    nombre: "Niños · 0 a 8 años", precio: "$70.000", tiempo: "1h",
    desc: "Corte + refrescado con definición sencilla.",
    incluye: "Corte + refrescado con definición sencilla",
  },
  {
    id: "n-9", grupo: "Niños", orden: 30,
    nombre: "Niños · 9 años en adelante", precio: "$145.000 – $210.000", tiempo: "2h a 4h",
    desc: "Corte + definición sencilla.",
    incluye: "Lavado, corte + definición sencilla + secado al 70%",
    matriz: [
      { d: "Baja", pa: "$121.000", pb: "$161.000", ta: "1h 30min", tb: "1h 30min" },
      { d: "Media", pa: "$145.000", pb: "$175.000", ta: "2h", tb: "2h 30min" },
      { d: "Alta", pa: "$167.000", pb: "$187.000", ta: "2h 30min", tb: "3h" },
      { d: "Extra alta", pa: "$197.000", pb: "$210.000", ta: "3h", tb: "3h 30min" },
    ],
  },
  {
    id: "p-sencillo", grupo: "Peinados", orden: 10,
    nombre: "Peinado sencillo", precio: "$30.000", tiempo: "30 min",
    desc: "Recogido lateral o trenza lateral.", incluye: "No incluye definición",
  },
  {
    id: "p-fiesta", grupo: "Peinados", orden: 20,
    nombre: "Peinado de fiesta", precio: "$60.000", tiempo: "1h",
    desc: "Semirecogido o recogido.", nota: "*no incluye lavado ni definición.",
  },
  {
    id: "mq-social", grupo: "Maquillaje", orden: 10,
    nombre: "Maquillaje social", precio: "$130.000", tiempo: "1h", desc: "Para eventos.",
  },
  {
    id: "mq-novias", grupo: "Maquillaje", orden: 20,
    nombre: "Maquillaje de novia", precio: "$290.000", tiempo: "1h 30min",
    desc: "Para novias.", incluye: "Prueba de maquillaje previa",
  },
  { id: "u-conv-manos", grupo: "Uñas", orden: 10, nombre: "Convencional · manos", precio: "$32.000", tiempo: "1h" },
  { id: "u-conv-pies", grupo: "Uñas", orden: 20, nombre: "Convencional · pies", precio: "$35.000", tiempo: "1h" },
  { id: "u-semi-manos", grupo: "Uñas", orden: 30, nombre: "Semipermanente · manos", precio: "$58.000", tiempo: "2h" },
  { id: "u-semi-pies", grupo: "Uñas", orden: 40, nombre: "Semipermanente · pies", precio: "$58.000", tiempo: "2h" },
  { id: "u-forr-manos", grupo: "Uñas", orden: 50, nombre: "Forrado · manos", precio: "$85.000", tiempo: "2h 30min" },
  { id: "u-forr-pies", grupo: "Uñas", orden: 60, nombre: "Forrado · pies", precio: "$85.000", tiempo: "2h 30min" },
  { id: "u-press-manos", grupo: "Uñas", orden: 70, nombre: "Press on · manos", precio: "$95.000", tiempo: "2h 30min" },
];

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
    "Tratamiento": "Tratamiento", "Transición": "Transición", "Hombres": "Hombres", "Niños": "Niños",
    "Peinados": "Peinados", "Maquillaje": "Maquillaje", "Uñas": "Uñas",
  },
  en: {
    "Servicio Full": "The full service", "Mujeres": "Women · haircut", "Definición": "Definition",
    "Tratamiento": "Treatment", "Transición": "Transition", "Hombres": "Men", "Niños": "Kids",
    "Peinados": "Hairstyling", "Maquillaje": "Makeup", "Uñas": "Nails",
  },
};

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

export const ESTILISTAS = ["Marcela", "Tatiana", "Julián", "Sara"];

/** Lo que se abona para apartar el cupo, y se descuenta del total */
export const ABONO = 50_000;

/** Datos de pago de la sede. Los corchetes son lo que falta por definir. */
export const PAGOS = {
  cuenta: "[número de cuenta por definir]",
  llave: "[llave Bre-B por definir]",
  link: "[link de pago por definir]",
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
