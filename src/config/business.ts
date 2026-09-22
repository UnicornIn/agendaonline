import type { TimeSlot } from "../types";

export interface PaymentMethod {
  id: string;
  name: string;
  detail: string;
  /** Texto que se copia al portapapeles; sin valor = no muestra botón "Copiar" */
  copy?: string;
  /** Dato aún por definir: se resalta en rosado */
  pending?: boolean;
}

export interface BusinessConfig {
  brand: string;
  branch: { id: string; name: string; city: string };
  hoursText: string;
  schedule: {
    /** 0 = domingo … 6 = sábado */
    closedWeekdays: number[];
    /** Hora de cierre en minutos desde medianoche */
    closeAt: number;
    daysAhead: number;
    slots: TimeSlot[];
  };
  deposit: { default: number; color: number };
  whatsapp: string;
  paymentMethods: PaymentMethod[];
  policies: { reschedule: string };
}

const env = import.meta.env;

/** Datos del negocio y la sede. Lo que hoy está "por definir" se completa aquí. */
export const business: Readonly<BusinessConfig> = Object.freeze({
  brand: "Rizos Felices",
  branch: {
    id: env.VITE_BRANCH_ID ?? "suramericana",
    name: "Suramericana",
    city: "Medellín",
  },
  hoursText: "Atendemos con cita previa, de lunes a sábado de 9:00 a.m. a 6:00 p.m.",

  schedule: {
    closedWeekdays: [0],
    closeAt: 18 * 60,
    daysAhead: 16,
    slots: [
      { label: "9:00 am", start: 540 },
      { label: "10:30 am", start: 630 },
      { label: "12:00 m", start: 720 },
      { label: "1:30 pm", start: 810 },
      { label: "3:00 pm", start: 900 },
      { label: "4:30 pm", start: 990 },
    ],
  },

  deposit: {
    default: 50000,
    color: 90000, // Color separa insumos
  },

  whatsapp: env.VITE_WHATSAPP_NUMBER ?? "573000000000", // TODO: número real de la sede

  paymentMethods: [
    { id: "nequi", name: "Nequi", detail: "[número por definir]", copy: "Nequi: número por definir", pending: true },
    { id: "bancolombia", name: "Bancolombia · Ahorros", detail: "[cuenta por definir] · Rizos Felices", copy: "Bancolombia: cuenta por definir", pending: true },
    { id: "addi", name: "Addi", detail: "Difiere el valor del servicio en el salón" },
    { id: "card", name: "Tarjeta débito o crédito", detail: "Link de pago por habilitar", pending: true },
  ],

  policies: {
    reschedule:
      "Puedes reprogramar hasta 2 horas antes, una sola vez, con el mismo abono. Si no asistes sin avisar, el abono no se tiene en cuenta y en la próxima reserva se abona de nuevo.",
  },
});
