import type { Catalog, Density } from "../types";

/* =========================================================
   Catálogo local — Sede Suramericana, Medellín
   Fuente: "Landing de Autoagendamiento — Ruta y Diseño" (17-sep-2026)
   Se usa cuando VITE_USE_MOCKS=true o como forma esperada de la respuesta
   de GET /branches/:branchId/catalog.
   ========================================================= */

const services: Catalog["services"] = {
  corte: {
    name: "Corte", from: "$60.000", diag: "full", needsType: false,
    options: [{ id: "corte", label: "Corte", price: "$60.000–$110.000", time: "1h 30min",
      includes: ["Lavado", "Definición express", "Secado"] }],
  },
  definicion: {
    name: "Definición", from: "$40.000", diag: "full", needsType: true,
    easy: [
      { id: "def-exp", label: "Definición Express", price: "$40.000–$80.000", time: "1h 30min",
        desc: "Lo más rápido", includes: ["Lavado", "Secado al 70%", "Trabajo con cepillo o manos"] },
      { id: "def-det", label: "Definición Detallada", price: "$130.000–$190.000", time: "2h",
        desc: "Con mascarilla", includes: ["Lavado", "Mascarilla", "Definición rizo a rizo", "Secado al 100%"] },
    ],
    hard: [
      { id: "def-det-h", label: "Definición Detallada", price: "$160.000–$195.000", time: "3h",
        desc: "Para cabello que necesita más trabajo",
        includes: ["Lavado", "Mascarilla", "Definición rizo a rizo", "Secado al 100%"],
        note: "Mismo servicio que la detallada, con más tiempo de trabajo para tu textura." },
    ],
  },
  tratamiento: {
    name: "Tratamiento", from: "$150.000", diag: "full", needsType: false,
    options: [{ id: "ozono", label: "Ozonoterapia", price: "$150.000", time: "1h 30min",
      includes: ["Lavado", "Definición express", "Secado al 50%"] }],
  },
  full: {
    name: "Full", from: "$145.000", diag: "full", needsType: true,
    easy: [{ id: "full-e", label: "Servicio Full", price: "$145.000–$190.000", time: "2h 30min",
      includes: ["Corte", "Lavado", "Mascarilla", "Definición detallada", "Secado al 100%", "Rizotipo en PDF"] }],
    hard: [{ id: "full-h", label: "Servicio Full", price: "$175.000–$210.000", time: "3h 30min",
      includes: ["Corte", "Lavado", "Mascarilla", "Definición detallada", "Secado al 100%", "Rizotipo en PDF", "Registro fotográfico", "Recomendaciones personalizadas"] }],
  },
  color: {
    name: "Color", from: "$380.000", diag: "full", needsColor: true,
    options: [
      { id: "col-dir", label: "Color directo o canas", price: "$380.000–$650.000", time: "3h 30min",
        desc: "Un solo tono o cobertura de canas",
        includes: ["Asesoría de color", "Mascarilla", "Definición", "Secado", "Rizotipo con cuidado post color", "Registro fotográfico"] },
      { id: "col-nat", label: "Diseño de color", price: "$680.000–$1.200.000", time: "4h",
        desc: "Cabello natural",
        includes: ["Asesoría de color", "Mascarilla", "Definición", "Secado", "Rizotipo con cuidado post color", "Registro fotográfico"] },
      { id: "col-pro", label: "Diseño de color", price: "$680.000–$1.200.000", time: "6h",
        desc: "Cabello con proceso químico previo",
        includes: ["Asesoría de color", "Mascarilla", "Definición", "Secado", "Rizotipo con cuidado post color", "Registro fotográfico"] },
    ],
  },
  transicion: {
    name: "Transición", from: "$195.000", diag: "full", needsType: false,
    options: [{ id: "trans", label: "Transición", price: "$195.000–$260.000", time: "3h",
      includes: ["Lavado", "Trabajo de transición", "Secado"],
      note: "No es un cambio permanente: es una ayuda mientras tu rizo natural va creciendo." }],
  },
  maquillaje: {
    name: "Maquillaje", from: "$130.000", needsType: false,
    options: [
      { id: "maq-soc", label: "Maquillaje social", price: "$130.000", time: "2h", desc: "Para el día a día", includes: ["Preparación de piel", "Maquillaje social"] },
      { id: "maq-esp", label: "Novia o quince", price: "$250.000", time: "3h", desc: "Ocasión especial", includes: ["Preparación de piel", "Maquillaje de larga duración", "Prueba de tono"] },
    ],
  },
  peinados: {
    name: "Peinados", from: "$120.000", diag: "dens", needsType: false,
    options: [
      { id: "pei-sen", label: "Peinado sencillo", price: "$120.000", time: "1h", desc: "Para cualquier día", includes: ["Preparación", "Peinado sencillo"] },
      { id: "pei-esp", label: "Peinado especial", price: "$250.000", time: "3h", desc: "Novia o quince", includes: ["Preparación", "Peinado de ocasión", "Fijación de larga duración"] },
    ],
  },
  unas: {
    name: "Uñas", from: "$50.000", needsType: false,
    options: [
      { id: "una-tra", label: "Uñas tradicionales", price: "$50.000", time: "1h", includes: ["Limpieza", "Esmaltado tradicional"] },
      { id: "una-semi", label: "Semipermanente", price: "$80.000", time: "2h", includes: ["Limpieza", "Esmaltado semipermanente"] },
    ],
  },
};

const order: Catalog["order"] = ["corte", "definicion", "tratamiento", "full", "color", "transicion", "maquillaje", "peinados", "unas"];

/* Matriz densidad x plasticidad -> [precio, minutos] por densidad.
   easy = el rizo se forma solo · hard = necesita ayuda.
   SUPUESTOS a validar con operación; extremos anclados al catálogo. */
const densities: Density[] = ["Baja", "Media", "Alta", "Extra alta"];
const matrix: Catalog["matrix"] = {
  "corte":     { easy: [[60000, 60], [77000, 75], [94000, 90], [110000, 105]], hard: [[60000, 90], [77000, 105], [94000, 120], [110000, 150]] },
  "def-exp":   { easy: [[40000, 60], [53000, 75], [66000, 90], [80000, 105]] },
  "def-det":   { easy: [[130000, 90], [150000, 120], [170000, 150], [190000, 180]] },
  "def-det-h": { hard: [[160000, 150], [172000, 180], [184000, 210], [195000, 240]] },
  "ozono":     { easy: [[150000, 75], [150000, 90], [150000, 105], [150000, 120]], hard: [[150000, 105], [150000, 120], [150000, 135], [150000, 150]] },
  "full-e":    { easy: [[145000, 120], [160000, 150], [175000, 180], [190000, 210]] },
  "full-h":    { hard: [[175000, 180], [187000, 210], [198000, 240], [210000, 270]] },
  "trans":     { easy: [[195000, 150], [217000, 180], [239000, 210], [260000, 240]], hard: [[195000, 180], [217000, 210], [239000, 240], [260000, 300]] },
  "col-dir":   { easy: [[380000, 180], [470000, 210], [560000, 240], [650000, 270]], hard: [[380000, 210], [470000, 240], [560000, 270], [650000, 300]] },
  "col-nat":   { easy: [[680000, 210], [853000, 240], [1026000, 270], [1200000, 300]], hard: [[680000, 240], [853000, 270], [1026000, 300], [1200000, 330]] },
  "col-pro":   { easy: [[680000, 330], [853000, 360], [1026000, 390], [1200000, 420]], hard: [[680000, 360], [853000, 390], [1026000, 420], [1200000, 450]] },
  "pei-sen":   { easy: [[120000, 45], [120000, 60], [120000, 75], [120000, 90]] },
  "pei-esp":   { easy: [[250000, 150], [250000, 180], [250000, 210], [250000, 240]] },
};

/* Complementos ofrecidos después de cada servicio. "DEF" = definición según plasticidad. */
const extras: Catalog["extras"] = {
  corte:       [["tratamiento", "ozono"], ["definicion", "DEF"], ["unas", "una-semi"]],
  definicion:  [["tratamiento", "ozono"], ["corte", "corte"], ["unas", "una-semi"]],
  full:        [["tratamiento", "ozono"], ["unas", "una-semi"], ["maquillaje", "maq-soc"]],
  color:       [["tratamiento", "ozono"], ["corte", "corte"]],
  tratamiento: [["definicion", "DEF"], ["corte", "corte"], ["unas", "una-semi"]],
  transicion:  [["tratamiento", "ozono"], ["corte", "corte"]],
  maquillaje:  [["peinados", "pei-sen"], ["unas", "una-semi"]],
  peinados:    [["maquillaje", "maq-soc"], ["unas", "una-semi"]],
  unas:        [["maquillaje", "maq-soc"]],
};

/* Comparativo "por separado vs Full" usado en los puentes de venta */
const bundle: Catalog["bundle"] = {
  easy: { separatePrice: "$190.000 y $300.000", separateTime: "3h 30min" },
  hard: { separatePrice: "$220.000 y $305.000", separateTime: "4h 30min" },
};

export const LOCAL_CATALOG: Catalog = Object.freeze({ services, order, densities, matrix, extras, bundle });
