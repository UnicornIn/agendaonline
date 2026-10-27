export interface BusinessConfig {
  brand: string;
  hoursText: string;
  /** Cuántos días hacia adelante se pueden ver. El backend manda el suyo en /config. */
  diasAdelanteFallback: number;
  /** El WhatsApp del agente, solo dígitos con indicativo, como lo quiere wa.me */
  whatsappAgente: string;
}

/**
 * Lo poco del negocio que NO sale de la agenda.
 *
 * Todo lo que la agenda sí sabe —sede, abono, medios de pago, políticas,
 * WhatsApp, horarios— vive ahora en `GET /public/agendamiento/config` y se lee
 * con `useAgendaConfig()`. Tenerlo quemado acá era tener dos verdades: el día
 * que la sede cambiara su Nequi, la web seguiría mostrando el viejo.
 *
 * Lo que queda es texto de marca, que no está en ninguna base de datos.
 */
export const business: Readonly<BusinessConfig> = Object.freeze({
  brand: "Rizos Felices",
  hoursText: "Atendemos con cita previa, de lunes a sábado de 9:00 a.m. a 6:00 p.m.",
  diasAdelanteFallback: 16,
  // +57 312 696 7066. Es una persona de verdad contestando, no un bot: por eso
  // el botón sale de la app en vez de abrir una pantalla propia.
  whatsappAgente: "573126967066",
});
