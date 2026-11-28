import type { Lang } from "../types";

/* =========================================================
   Los textos, en español y en inglés

   Un solo diccionario con `[es, en]` por clave, y no dos archivos: así una
   frase nueva no se puede agregar a medias, que es como las traducciones se
   desincronizan.

   Los textos con HTML (`<br>`, `<b>`) se pintan con dangerouslySetInnerHTML
   desde el componente Html. Es contenido nuestro, de este archivo, no de
   ninguna entrada de la clienta.
   ========================================================= */

export const TEXTOS = {
  intro: ["Si ya eres cliente de Rizos Felices, con tus datos traemos el historial de tu cabello y agendas en dos toques.",
          "If you are already a Rizos Felices client, we bring up your hair history and you book in two taps."],
  // La línea de la sede ya no vive acá: la arma `etiquetaDeSede()` en
  // src/data/sede.ts con el nombre y la ciudad que manda el servidor. Con
  // ocho sedes, un texto fijo era el nombre de una sola y el de nadie más.
  // Sin horas, y a propósito. Decía "de lunes a sábado de 9:00 a.m. a 6:00
  // p.m.", que era el horario de Suramericana escrito como si fuera el de la
  // cadena: El Restrepo abre 8:00 y atiende domingos, y cada sede es distinta.
  // La agenda no tiene horario de sede —el turno es de cada estilista— así que
  // acá no hay de dónde sacar la hora correcta, y la equivocada manda a la
  // clienta a llegar a una hora en que el salón está cerrado. Las horas de
  // verdad las dice la pantalla de fecha, que sale de los turnos cargados.
  horario: ["Atendemos con cita previa.", "By appointment only."],
  tituloInicio: ["Agenda tu cita<br>en Rizos Felices", "Book your appointment<br>at Rizos Felices"],
  btnCliente: ["Ya soy cliente de Rizos Felices", "I'm already a client"],
  btnPrimera: ["Cita primera vez", "First-time appointment"],

  // ---- Mientras se resuelve la sede ----
  //
  // Acá hubo textos de dos pantallas que ya no existen: una que listaba las
  // sedes para elegir y otra que pedía el enlace de la tuya. La web tiene UNA
  // pantalla y es la de la sede; sin apodo en la URL se entra a la primera de
  // `AUTOAGENDAMIENTO_SEDES`. Lo que queda son los dos estados que sí hay que
  // poder contar: todavía no llegó, y no se pudo traer.
  cargandoSedes: ["Cargando las sedes…", "Loading salons…"],
  errorSedes: ["No pudimos cargar las sedes. Revisa tu conexión e inténtalo de nuevo; si sigue igual, escríbenos por WhatsApp y te agendamos.",
               "We couldn't load the salons. Check your connection and try again; if it keeps failing, message us on WhatsApp and we'll book you."],
  sinSedes: ["Por ahora no hay sedes agendando en línea. Escríbenos por WhatsApp y te agendamos.",
             "No salons are booking online right now. Message us on WhatsApp and we'll book you."],
  btnAgente: ["Prefiero ser atendida por un agente", "I'd rather talk to an agent"],
  ayudaDudas: ["¿Tienes dudas? Escríbenos por WhatsApp", "Questions? Message us on WhatsApp"],
  saludoDudas: [
    "Hola, estoy agendando por la página y tengo una duda.",
    "Hi, I'm booking on the website and I have a question.",
  ],
  saludoAgente: [
    "Hola, vengo de la página de agendamiento y prefiero que me atienda un agente.",
    "Hi, I came from the booking page and I'd rather be helped by an agent.",
  ],
  identTitulo: ["Cuéntanos quién<br>eres", "Tell us who<br>you are"],
  identSub: ["Tu nombre, y el celular o el correo con el que te registraron en el salón. Con cualquiera de los dos traemos tu historial.",
             "Your name, and the phone or email the salon registered you with. Either one brings up your history."],
  /* Sin el campo de nombre. Ver `business.pedirNombreEnLogin`. */
  identSubSoloContacto: ["El celular o el correo con el que te registraron en el salón. Con cualquiera de los dos traemos tu historial.",
             "The phone or email the salon registered you with. Either one brings up your history."],
  celular: ["Celular", "Mobile"],
  correo: ["Correo", "Email"],
  buscar: ["Buscar mi historial", "Find my history"],
  buscando: ["Buscando…", "Searching…"],
  errTel: ["Revisa el número: para ese país esperamos %n dígitos.", "Check the number: we expect %n digits for that country."],
  errMail: ["Escribe un correo válido.", "Enter a valid email."],
  noHist: ["No encontramos un historial con esos datos. Revisa que el nombre esté como te registraron, o sigue y te agendamos como primera vez.",
           "We couldn't find a history with those details. Check the name matches how the salon registered you, or continue and we'll book you as a first-timer."],
  holaX: ["Hola %s", "Hi %s"],
  escogerCual: ["Escoger cu\u00e1l", "Choose which one"],
  sinRepetibles: [
    "Lo que te has hecho con nosotros todavía no se agenda por acá. Elige del menú y te guardamos el cupo igual.",
    "What you've had done with us can't be booked here yet. Pick from the menu and we'll still hold your slot.",
  ],
  histTitulo: ["Aquí el historial<br>de tu cabello", "Here's your hair<br>history"],
  tuPerfil: ["Tu perfil", "Your profile"],
  tuEstilista: ["Tu estilista", "Your stylist"],
  tuCabello: ["Tu cabello", "Your hair"],
  ultimaVez: ["Tu última visita fue el %s", "Your last visit was on %s"],
  yaNosConoces: ["Ya nos conoces", "We already know you"],
  repetir: ["Repetir este servicio", "Book this again"],
  otroServicio: ["Quiero otro servicio", "I want a different service"],
  noSoyYo: ["No soy yo · cambiar datos", "Not me · change details"],
  menuTitulo: ["¿Qué te vas a hacer?", "What are you booking?"],
  menuSub: ["Toca un servicio para ver el detalle y el valor.", "Tap a service to see details and price."],
  yaDiagDens: [
    "Ya sabemos que tu densidad es <b>%d</b>. Solo falta una pregunta.",
    "We already know your density is <b>%d</b>. Just one question left.",
  ],
  yaDiag: ["Ya tenemos tu diagnóstico: <b>densidad %d · %p</b>. No te lo volvemos a preguntar.",
           "We already have your diagnosis: <b>%d density · %p</b>. We won't ask again."],
  cambio: ["Mi cabello cambió", "My hair changed"],
  verDetalle: ["Ver detalle ›", "See details ›"],
  variaPrecio: ["Los valores varían según el largo y la densidad de tu cabello.", "Prices vary with hair length and density."],
  apartando: ["Apartando tu cupo…", "Holding your spot…"],
  cupoTomado: ["Esa hora la acaban de tomar. Elige otra, por favor.",
               "That time was just taken. Please pick another one."],
  cargandoServicios: ["Cargando los servicios de la sede…", "Loading the salon's services…"],
  errorCatalogo: ["No pudimos cargar los servicios de la sede. Revisa tu conexión e inténtalo de nuevo; si sigue igual, escríbenos por WhatsApp y te agendamos.",
                  "We couldn't load the salon's services. Check your connection and try again; if it keeps failing, message us on WhatsApp and we'll book you."],
  sinServicios: ["La sede no tiene servicios disponibles para agendar en línea en este momento.",
                 "This salon has no services available to book online right now."],
  cargandoHoras: ["Buscando horas libres…", "Looking for open times…"],
  sinHoras: ["No quedan horas libres ese día. Prueba con otro.",
             "No times left that day. Try another one."],
  sedeCerrada: ["La sede no abre ese día.", "The salon is closed that day."],
  // No es "prueba con otro día": sin turnos cargados fallan TODOS los días, y
  // mandarla a seguir buscando es mandarla a perder el rato. Se le da la
  // salida que sí funciona, que es el WhatsApp que ya está en pantalla.
  sinHorario: ["Esta sede todavía no tiene horarios publicados. Escríbenos por WhatsApp y te agendamos.",
               "This salon hasn't published its hours yet. Message us on WhatsApp and we'll book you."],
  sinEstilistas: ["Ningún profesional de la sede presta todos los servicios que elegiste.",
                  "No stylist at this salon performs every service you picked."],
  paso1: ["Paso 1 de 2 · Tu cabello", "Step 1 of 2 · Your hair"],
  paso2: ["Paso 2 de 2 · Tu cabello", "Step 2 of 2 · Your hair"],
  // Las familias sin eje de plasticidad —el color— tienen UN solo paso de
  // diagnóstico. Decirle "paso 1 de 2" y mandarla derecho al detalle la deja
  // esperando una pantalla que no va a llegar.
  pasoUnico: ["Tu cabello", "Your hair"],
  densTitulo: ["¿Cuánto cabello<br>tienes?", "How much hair<br>do you have?"],
  densSub: ["A eso le decimos densidad: no es qué tan grueso es cada hilo, sino cuántos hilos tienes. Mira las fotos y toca la que se parezca al tuyo, suelto y seco.",
            "That's density: not how thick each strand is, but how many strands you have. Look at the photos and tap the one closest to your hair, loose and dry."],
  densNota: ["Con esto calculamos tu valor exacto y cuánto tiempo reservamos de la agenda de tu estilista.",
             "This gives us your exact price and how much of your stylist's day we block."],
  plastTitulo: ["¿Tu rizo se forma fácil<br>al definirlo, o le cuesta?",
               "Does your curl shape up<br>easily, or is it a struggle?"],
  plastSub: ["A eso le decimos plasticidad. Junto con la densidad define tu valor y el tiempo que reservamos.",
             "That's plasticity. Together with density it sets your price and your time slot."],
  soloSe: ["Se forma fácil", "Shapes up easily"],
  soloSeH: ["Lo defines y el rizo se arma de una", "You define it and the curl is right there"],
  ayuda: ["Le cuesta", "It's a struggle"],
  ayudaH: ["Hay que armarlo mechón por mechón", "It has to be shaped strand by strand"],
  dudas: ["Si dudas, elige el que más se parezca. En el salón la estilista confirma el diagnóstico antes de comenzar.",
          "If unsure, pick the closest one. Your stylist confirms it at the salon before starting."],
  queIncluye: ["Qué incluye", "What's included"],
  tuValor: ["Tu valor, calculado con tu diagnóstico", "Your price, from your diagnosis"],
  duracionAprox: ["Duración aproximada", "Approximate duration"],
  reservamos: ["Reservamos <b>%t</b> de la agenda de tu estilista.", "We block <b>%t</b> of your stylist's day."],
  avisoAbono: ["Para apartar tu cita se abona <b>%a</b>, que se descuentan del valor total.",
               "To hold your spot you pay <b>%a</b> up front, deducted from the total."],
  continuar: ["Continuar", "Continue"],
  extrasTitulo: ["¿Agregas algo más<br>a tu cita?", "Anything else<br>for your visit?"],
  extrasSub: ["Se hacen el mismo día, uno después del otro. Sumamos el tiempo a tu bloque para que alcance.",
              "Done the same day, one after the other. We add the time to your slot."],
  sinAgregar: ["Continuar sin agregar", "Continue without extras"],
  histCon: ["con %s", "with %s"],
  maquinaQuienes: ["Son quienes cortan con máquina. Escoge una para ver sus horas.",
                   "These are the people who cut with clippers. Pick one to see their times."],
  sinEstilistasMaquina: ["Nadie disponible para corte con máquina en este servicio. Escríbenos por WhatsApp y lo resolvemos.",
                         "No one is available for a clipper cut on this service. Message us on WhatsApp and we'll sort it out."],
  // El corte: se pregunta por el RESULTADO, no por la herramienta. La clienta
  // sabe cómo se quiere ver, no con qué se hace; "máquina (barbería)" además
  // no le habla a una mujer ni a una mamá agendando a su hijo.
  corteTitulo: ["¿Cómo quieres<br>el corte?", "How would you like<br>your cut?"],
  corteSub: ["Esto define quién te puede atender.", "This decides who can take you."],
  corteTijera: ["Con tijera", "With scissors"],
  corteTijeraH: ["Puntas, capas, forma. El corte de siempre.",
                 "Ends, layers, shape. The usual cut."],
  corteMaquina: ["Con máquina", "With clippers"],
  // "Al ras" es de peluquería. "Muy cortos" lo entiende cualquiera.
  corteMaquinaH: ["Degradado, rapado, o los lados y la nuca muy cortos.",
                  "Fades, buzz cuts, or the sides and nape very short."],
  // Sin empujar hacia ninguna de las dos. La versión anterior decía "si no
  // estás segura, elige máquina" —porque quien usa máquina también corta con
  // tijera, así que el error salía barato— y eso habría mandado a media sede
  // a las dos personas que la usan: sus agendas llenas, las del resto vacías.
  // Un mensaje que reparte mal el trabajo cuesta más que una cita reagendada.
  // Cuál es cuál ya lo dicen las dos tarjetas; acá va solo lo que ellas no
  // pueden decir.
  // Palabras de salón, no de manual: "acabado" y "disponibilidad" obligan a
  // traducir antes de decidir, y quien lee rápido no traduce: escoge
  // cualquiera. Cada frase dice UNA cosa, en el orden en que se piensa —por
  // qué hay menos horas, y qué hacer con eso.
  //
  // La segunda frase resuelve el caso que de verdad confunde: el corte que
  // lleva las dos, como un degradado con tijera arriba. Las tarjetas lo
  // presentan como una decisión entre dos, y quien lleva las dos no sabe
  // dónde ponerse.
  //
  // Es una regla para ESE caso, no un default para quien duda. La diferencia
  // importa: una versión anterior decía "si no estás segura, elige máquina"
  // y eso habría mandado a media sede a las dos personas que la usan, con
  // sus agendas llenas y las del resto vacías. Acá solo se mueve quien
  // necesita la máquina de verdad, que es donde tiene que estar.
  corteNota: ["Pocas personas en el salón cortan con máquina, por eso vas a ver menos horas libres. <b>Si tu corte lleva máquina y tijera, escoge máquina.</b>",
              "Only a few people here cut with clippers, so you'll see fewer open times. <b>If your cut uses both clippers and scissors, choose clippers.</b>"],
  fechaTitulo: ["Elige fecha y hora", "Pick a date and time"],
  fechaSub: ["Solo ves horarios donde tu servicio cabe completo antes de cerrar.",
             "You only see slots where your service fits before closing."],
  conQuien: ["Con quién", "With whom"],
  primeraDisp: ["La primera disponible", "First available"],
  dia: ["Día", "Day"],
  masFechas: ["Ver más fechas", "See more dates"],
  cerrarCalendario: ["Ocultar el calendario", "Hide the calendar"],
  volverAHoy: ["Volver a los próximos días", "Back to the next days"],
  mesAnterior: ["Mes anterior", "Previous month"],
  mesSiguiente: ["Mes siguiente", "Next month"],
  horarios: ["Horarios disponibles", "Available times"],
  sinCupo: ["No queda cupo ese día. Prueba otro día o deja que te asignemos la primera disponible.",
            "No room that day. Try another day or let us assign the first available stylist."],
  bloqueDe: ["bloque de %t", "%t slot"],
  bloque: ["Bloque", "Slot"],
  confTitulo: ["Confirma tu cita", "Confirm your appointment"],
  confSub: ["Revisa que todo esté bien antes de reservar.", "Check everything before booking."],
  servicio: ["Servicio", "Service"],
  servicios: ["Servicios", "Services"],
  valor: ["Valor", "Price"],
  cuando: ["Cuándo", "When"],
  con: ["Con", "With"],
  nombreCompleto: ["Nombre completo", "Full name"],
  nombrePh: ["Como te registraron en el salón", "As the salon registered you"],
  correoOpcional: ["Correo (opcional)", "Email (optional)"],
  errNombre: ["Escribe tu nombre y apellido.", "Enter your first and last name."],
  irAbono: ["Continuar al abono", "Continue to deposit"],
  abonoTitulo: ["Aparta tu cupo", "Hold your spot"],
  abonoSub: ["Haz el abono, sube la foto del comprobante y tu cita queda confirmada al instante.",
             "Pay the deposit, upload the receipt photo and your appointment is confirmed right away."],
  abono: ["Abono", "Deposit"],
  // --- la campaña de reactivación ---
  // El título, el detalle y el aviso de fechas los manda el backend en
  // español: son los mismos textos que acompañan la regla que él aplica al
  // cobrar, y tenerlos acá sería garantizar que algún día digan cosas
  // distintas. Lo de abajo es solo la traducción al inglés y las etiquetas.
  promoAviso: ["",
    "Your 20% discount applies only to appointments taking place between "
    + "November 12 and 30, 2026. An appointment booked in November for "
    + "December gets no discount."],
  promoTitulo: ["", "You have a special benefit"],
  promoDetalle: ["", "20% off all our services."],
  promoAplicado: ["Beneficio aplicado", "Benefit applied"],
  promoAhorras: ["Ahorras %s", "You save %s"],
  promoAntes: ["Antes %s", "Was %s"],
  pagasSalon: ["Pagas %s en el salón", "You pay %s at the salon"],
  saldo: ["Pagas en el salón", "You pay at the salon"],
  elResto: ["el resto", "the rest"],
  comoPagar: ["Cómo hacer el abono", "How to pay the deposit"],
  // El banco NO va en el texto: sale del dato de la sede. Estuvo acá
  // mientras la única cuenta era de Bancolombia, y las cuentas reales de las
  // demás sedes no lo son —El Restrepo recauda en Caja Social, Rionegro en
  // NU—. Un número de un banco tecleado en otro no falla: puede caer en una
  // cuenta ajena que exista con ese número.
  transferencia: ["Transferencia", "Bank transfer"],
  aNombreDe: ["A nombre de", "Account holder:"],
  ahorros: ["Cuenta de ahorros", "Savings account"],
  llave: ["Llave Bre-B", "Bre-B key"],
  // Sin uso hoy: la sede todavía no tiene link de pago y su fila no se
  // muestra (`PAGOS.link` en null). Se quedan porque el link va a existir, y
  // el día que exista es un dato en el catálogo, no volver a escribir esto.
  linkPago: ["Link de pago", "Payment link"],
  abrirLink: ["Abrir", "Open"],
  copiar: ["Copiar", "Copy"],
  copiado: ["Copiado", "Copied"],
  subirTitulo: ["Sube el comprobante", "Upload the receipt"],
  subirDrop: ["Toca para subir la foto", "Tap to upload the photo"],
  subirHint: ["Captura de pantalla o foto del comprobante", "Screenshot or photo of the receipt"],
  verificando: ["Confirmando tu cita…", "Confirming your appointment…"],
  subiendo: ["Subiendo el comprobante…", "Uploading the receipt…"],
  errSubir: ["No pudimos subir la foto. Revisa tu conexión e intenta de nuevo.",
             "We couldn't upload the photo. Check your connection and try again."],
  errTipo: ["Sube una imagen: JPG, PNG o la captura de pantalla de tu banco.",
            "Upload an image: JPG, PNG or your bank's screenshot."],
  errPeso: ["Esa imagen pesa más de 10 MB. Usa la captura de pantalla del banco en vez de una foto.",
            "That image is over 10 MB. Use your bank's screenshot instead of a photo."],
  reintentar: ["Intentar de nuevo", "Try again"],
  cambiarFoto: ["Cambiar la foto", "Change photo"],
  listoTitulo: ["¡Cita confirmada!", "You're booked!"],
  listoSub: ["Listo, %s. Tu cita quedó confirmada y tu estilista ya la tiene en su agenda.",
             "All set, %s. Your appointment is confirmed and your stylist already has it."],
  avisoAgente: ["Esto le llegó al agente de la sede", "This is what the salon agent received"],
  etiqueta: ["Etiqueta: confirmar abono", "Tag: confirm deposit"],
  agendarOtra: ["Agendar otra cita", "Book another appointment"],
  calendario: ["Agregar a mi calendario", "Add to my calendar"],
  reprogramar: ["Puedes reprogramar hasta 2 horas antes, una sola vez, con el mismo abono.",
                "You can reschedule once, up to 2 hours before, keeping the same deposit."],
} as const;

export type ClaveTexto = keyof typeof TEXTOS;

/** Reemplazos de la forma `{ "%s": "Laura" }` */
export type Sustituciones = Record<string, string | number>;

export function traducir(lang: Lang, clave: ClaveTexto, rep?: Sustituciones): string {
  let texto: string = TEXTOS[clave][lang === "es" ? 0 : 1] ?? "";
  if (rep) for (const [k, v] of Object.entries(rep)) texto = texto.split(k).join(String(v));
  return texto;
}
