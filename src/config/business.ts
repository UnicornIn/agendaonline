export interface BusinessConfig {
  brand: string;
  hoursText: string;
  /** Cuántos días hacia adelante se pueden ver. El backend manda el suyo en /config. */
  diasAdelanteFallback: number;
  /** Hasta dónde llega el calendario, contado desde hoy. */
  diasAdelanteMaximo: number;
  /** Si la pantalla de identificación pide el nombre además del contacto. */
  pedirNombreEnLogin: boolean;
  /** El WhatsApp del agente, solo dígitos con indicativo, como lo quiere wa.me */
  whatsappAgente: string;
  /** El WhatsApp de dudas: el botón flotante que acompaña todo el flujo. */
  whatsappDudas: string;
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

  // Hasta dónde deja escoger el calendario. La tira sigue mostrando los
  // dieciséis días de siempre, que es donde cae casi todo; esto es el techo
  // de lo OTRO, la clienta que quiere su color para dentro de dos meses y
  // antes no tenía dónde pedirlo.
  //
  // Noventa días es criterio de operación, no una medición. Vale la pena
  // saber que HOY NADIE LO EXIGE DEL LADO DEL SERVIDOR: el backend valida la
  // fecha pero no qué tan lejos está, así que este número es una cortesía de
  // la pantalla y no un candado. Subirlo mucho es ofrecer horas que dependen
  // de un horario que la sede todavía no ha escrito.
  diasAdelanteMaximo: 90,

  // Apagado desde el 2026-10-27, por decisión de operación. El campo dejaba
  // por fuera a la clienta que escribe "Juanita" cuando la sede la guardó
  // como "Juana María", que es justo la de años que el atajo busca.
  //
  // ESTE INTERRUPTOR VA JUNTO CON `AUTOAGENDAMIENTO_EXIGIR_NOMBRE` DEL
  // BACKEND. Prender uno solo es el peor de los casos: con el del backend
  // prendido y este apagado, la web no manda nombre y NADIE queda reconocida.
  // Al revés solo se le pide a la clienta un dato que nadie mira.
  pedirNombreEnLogin: false,
  // +57 312 696 7066. Es una persona de verdad contestando, no un bot: por eso
  // el botón sale de la app en vez de abrir una pantalla propia.
  whatsappAgente: "573126967066",

  // +57 314 719 3009. No es el del agente: este no agenda, resuelve dudas de
  // quien está a mitad del flujo y no sabe cuál servicio es el suyo. Por eso
  // el botón acompaña todas las pantallas en vez de vivir en la portada.
  whatsappDudas: "573147193009",
});
