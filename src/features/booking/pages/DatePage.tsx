import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { agendaApi, type ProfesionalApi } from "../../../api/agenda";
import { useApp } from "../../../context/AppContext";
import { PATHS } from "../../../router/paths";
import { business } from "../../../config/business";
import { calcularTotal } from "../../../lib/pricing";
import { campana, hayCampana } from "../../../data/configAgenda";
import { trackInitiateCheckout } from "../../../lib/metaPixel";
import { aISO, desdeISO, diasDesde, DOW, hoy, MON, sumarDias } from "../../../lib/dates";
import { BlockNote, Button, Chip, Kicker, Label, LinkButton, Sticky, Sub, Title } from "../../../components/ui";
import CalendarioMes from "../CalendarioMes";
import { useDiasConCupo } from "../useDiasConCupo";
import { maquinaDeEstaSede } from "../../../data/sede";

/**
 * Fecha, hora y con quién.
 *
 * Todo sale de la agenda: quiénes prestan ESE bloque de servicios, qué días
 * tienen algo libre y qué horas quedan. Nada se calcula acá — las horas
 * dependen del horario de cada profesional, de sus bloqueos, de las citas que
 * ya tiene y de las retenciones de otras clientas, y ninguna de esas cuatro
 * cosas la sabe el navegador.
 *
 * `motivo` es la razón por la que un día viene sin cupos, y se muestra
 * distinto cada una: que la sede esté cerrada ese día y que el martes esté
 * lleno llevan a la clienta a hacer cosas distintas.
 *
 * La fecha se elige en dos controles sobre el MISMO dato. La tira horizontal
 * resuelve el caso de siempre —"esta semana o la otra"— en un toque; el
 * calendario, que se abre debajo, es para lo que no cabe en la tira. No son
 * dos modos: la tira es una ventana corrida sobre el calendario, y al escoger
 * un día lejano se vuelve a abrir en él. Sin eso, escoger el 12 de diciembre
 * dejaba la tira mostrando noviembre, sin nada seleccionado, y la pantalla se
 * leía como que la elección no había pasado.
 */

/** Cuántos días muestra la tira desde donde esté parada. Van seguidos, los
 *  siete de la semana: la sede atiende todos los días y cuáles sirven lo dice
 *  la agenda, no el calendario. */
const DIAS_EN_LA_TIRA = 16;

type EstadoHoras =
  | { fase: "cargando" }
  | { fase: "listo"; horas: string[]; motivo: string | null }
  | { fase: "error"; mensaje: string };

export default function DatePage() {
  const navigate = useNavigate();
  const { t, lang, reserva, actualizar } = useApp();

  const total = calcularTotal(reserva);
  // La identidad del array cambia en cada render; la cadena no. Sin esto los
  // efectos se vuelven a disparar para siempre.
  const ids = total.servicioIds;
  const idsClave = ids.join(",");

  const primerDia = useMemo(() => hoy(), []);
  const ultimoDia = useMemo(
    () => sumarDias(primerDia, business.diasAdelanteMaximo),
    [primerDia]
  );

  // Dónde está parada la tira. `null` = en hoy, que es lo normal; se corre
  // sola cuando la clienta escoge en el calendario un día que no alcanzaba a
  // mostrar.
  const [anclaISO, setAnclaISO] = useState<string | null>(null);
  const dias = useMemo(() => {
    const tira = diasDesde(anclaISO ? desdeISO(anclaISO) : primerDia, DIAS_EN_LA_TIRA);
    // La tira se corre con el dia elegido, asi que cerca del tope se saldria
    // de el: escoger el dia 88 en el calendario dejaba en la tira dias que el
    // calendario mismo pinta apagados. El tope es el tope en los dos lados.
    const dentro = tira.filter((d) => d <= ultimoDia);
    // Nunca deberia quedar vacia —el calendario no deja escoger un dia pasado
    // el tope—, pero una tira vacia revienta la pantalla entera en la linea de
    // abajo, y eso no se arriesga por un caso que ademas seria el ultimo dia
    // que se puede agendar.
    return dentro.length ? dentro : tira.slice(0, 1);
  }, [anclaISO, primerDia, ultimoDia]);
  const fecha = reserva.fecha ?? aISO(dias[0]);

  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  const [profesionales, setProfesionales] = useState<ProfesionalApi[] | null>(null);
  const [horas, setHoras] = useState<EstadoHoras>({ fase: "cargando" });

  const { cupoPorDia, pedir } = useDiasConCupo(idsClave);

  /**
   * Con máquina, solo quienes saben usarla.
   *
   * El recorte se hace acá y no en el backend porque la lista vive en la
   * configuración de la web (`config.profesionalesMaquina`). Eso tiene un
   * límite y conviene tenerlo escrito: el servidor NO la conoce, así que lo
   * único que hace valer el filtro es que de acá salga un `profesionalId` de
   * los de la lista. Por eso abajo se esconde "la primera disponible".
   */
  const maquinistas = maquinaDeEstaSede();
  const conMaquina = reserva.corte === "maquina" && maquinistas.length > 0;
  /**
   * `null` mientras la lista no ha llegado, y eso hay que respetarlo: `null`
   * es "todavía no se sabe" y `[]` es "no hay nadie". Filtrar un `null` como
   * si fuera lista vacía le mostraba a la clienta "nadie disponible para
   * corte con máquina, escríbenos por WhatsApp" durante el segundo que tarda
   * la respuesta — en local no se alcanza a ver y en producción sí.
   */
  const ofrecidos = useMemo(
    () =>
      conMaquina && profesionales
        ? profesionales.filter((p) => maquinistas.includes(p.profesionalId))
        : profesionales,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conMaquina, profesionales]
  );

  /* ---- quiénes prestan este bloque ---- */
  useEffect(() => {
    if (!idsClave) return;
    let vigente = true;
    agendaApi
      .profesionales(idsClave.split(","))
      .then((lista) => vigente && setProfesionales(lista))
      // Sin la lista se agenda igual con "la primera disponible": el servidor
      // elige. Perder el cupo por no poder pintar unos nombres sería peor.
      .catch(() => vigente && setProfesionales([]));
    return () => {
      vigente = false;
    };
  }, [idsClave]);

  /* ---- la preferencia que viene del historial tiene que caber en ESTE bloque ---- */
  /**
   * Quien la atendió la vez pasada puede no prestar lo que escogió hoy. Con su
   * id puesto, la disponibilidad vuelve vacía con `sin_horarios` y la pantalla
   * dice "no hay estilistas": un callejón sin salida, cuando lo honesto es
   * ofrecerle la primera disponible.
   *
   * Solo se suelta cuando la lista LLEGÓ y trae gente: `null` es que todavía no
   * respondió y `[]` es que no se pudo pedir, y en esos dos casos el id sigue
   * siendo la mejor información que hay —el servidor filtra igual con él.
   */
  useEffect(() => {
    if (!ofrecidos?.length || !reserva.estilistaId) return;
    if (ofrecidos.some((p) => p.profesionalId === reserva.estilistaId)) return;
    actualizar({ estilista: null, estilistaId: null, hora: null });
  }, [ofrecidos, reserva.estilistaId, actualizar]);

  /**
   * Con máquina siempre hay alguien escogido.
   *
   * Sin "la primera disponible" en pantalla, un `estilistaId` en null sería
   * una reserva que el servidor reparte por carga entre TODO el plantel —y
   * ahí se pierde el filtro entero—. Se escoge la primera de la lista: la
   * clienta la ve marcada y puede cambiarla, pero nunca queda en null.
   */
  useEffect(() => {
    if (!conMaquina || reserva.estilistaId || !ofrecidos?.length) return;
    const p = ofrecidos[0];
    actualizar({ estilista: p.nombre, estilistaId: p.profesionalId });
  }, [conMaquina, ofrecidos, reserva.estilistaId, actualizar]);

  /* ---- qué días tienen algo, para no dejarla tocar uno por uno ---- */
  useEffect(() => {
    if (dias.length) pedir(dias[0], dias[dias.length - 1]);
  }, [dias, pedir]);

  /* ---- si hoy ya no da, se corre al primer dia que si ---- */
  useEffect(() => {
    // Solo mientras ella no haya tocado ningun dia. Despues de eso manda su
    // eleccion, aunque el dia se quede sin cupos mientras decide.
    if (reserva.fecha) return;
    const isos = dias.map(aISO);
    // Con la respuesta a medias el "primero con cupo" todavía puede ser uno
    // que no hemos mirado, y la selección saltaría dos veces.
    if (!isos.every((iso) => iso in cupoPorDia)) return;
    const primero = isos.find((iso) => cupoPorDia[iso]);
    if (primero && primero !== fecha) actualizar({ fecha: primero, hora: null });
  }, [cupoPorDia, dias, fecha, reserva.fecha, actualizar]);

  /* ---- las horas de ESE día ---- */
  useEffect(() => {
    if (!idsClave) return;
    let vigente = true;
    setHoras({ fase: "cargando" });
    agendaApi
      .disponibilidad(fecha, idsClave.split(","), reserva.estilistaId)
      .then((r) => {
        if (!vigente) return;
        setHoras({
          fase: "listo",
          horas: r.cupos.map((c) => c.hora),
          motivo: r.cupos.length ? null : (r.motivo ?? null),
        });
      })
      .catch((err: unknown) => {
        if (!vigente) return;
        setHoras({ fase: "error", mensaje: (err as Error)?.message ?? t("errorCatalogo") });
      });
    return () => {
      vigente = false;
    };
  }, [fecha, idsClave, reserva.estilistaId, t]);

  const libres = horas.fase === "listo" ? horas.horas : [];
  // La hora elegida puede dejar de estar libre al cambiar de día, de
  // profesional, o porque otra clienta la tomó mientras tanto.
  const hora = reserva.hora && libres.includes(reserva.hora) ? reserva.hora : null;

  const elegirProfesional = useCallback(
    (p: ProfesionalApi | null) =>
      actualizar({
        estilista: p?.nombre ?? null,
        estilistaId: p?.profesionalId ?? null,
        hora: null,
      }),
    [actualizar]
  );

  /** Un día escogido en el calendario. La tira se vuelve a abrir en él. */
  const elegirDelCalendario = useCallback(
    (iso: string) => {
      setAnclaISO(iso);
      setCalendarioAbierto(false);
      actualizar({ fecha: iso, hora: null });
    },
    [actualizar]
  );

  /** Devuelve la tira a hoy y suelta la elección, para que vuelva a caer
   *  sola en el primer día con cupo. */
  const volverAHoy = useCallback(() => {
    setAnclaISO(null);
    actualizar({ fecha: null, hora: null });
  }, [actualizar]);

  const kicker = [total.labels.join(" + "), total.tiempo && t("bloqueDe", { "%t": total.tiempo })]
    .filter(Boolean).join(" · ");

  // El InitiateCheckout va acá y no en cada toque de una hora: probar tres
  // horarios es una sola intención de agendar, no tres. Al dar continuar ya
  // eligió día y hora, que es lo que el evento dice que pasó.
  const continuar = () => {
    trackInitiateCheckout({
      servicio: total.labels.join(" + "),
      precio: total.n,
      ids: total.servicioIds,
    });
    navigate(PATHS.confirm);
  };

  /**
   * Los cuatro nombres son los que manda el backend, tal cual.
   *
   * Decían `sede_cerrada`, `dia_lleno`, `sin_horarios` y `fecha_pasada`, que
   * no son ninguno de los que existen: el backend manda `cerrado`, `lleno`,
   * `sin_horario` y `sin_profesional`. Así que los tres mensajes específicos
   * eran código muerto y los cuatro casos caían en el genérico —"no quedan
   * horas, prueba con otro día"— incluso cuando el problema no era el día.
   */
  const mensajeSinHoras = (motivo: string | null): string => {
    if (motivo === "cerrado") return t("sedeCerrada");
    if (motivo === "sin_profesional") return t("sinEstilistas");
    if (motivo === "sin_horario") return t("sinHorario");
    return t("sinHoras");
  };

  return (
    <>
      <Kicker style={{ marginTop: 14 }}>{kicker}</Kicker>
      <Title>{t("fechaTitulo")}</Title>
      <Sub>{t("fechaSub")}</Sub>

      {/* La condición de la campaña, justo donde se decide: el descuento
          depende del día de la CITA, no del día en que se agenda, y esta es
          la pantalla donde se escoge ese día. El texto en español viene del
          backend, que es quien aplica la regla al cobrar. */}
      {reserva.promocion && hayCampana() && (
        <BlockNote icon="★">
          {lang === "es" ? campana().aviso : t("promoAviso")}
        </BlockNote>
      )}

      <Label style={{ marginTop: 2 }}>{t("conQuien")}</Label>
      {ofrecidos?.length === 0 ? (
        <p className="sub" style={{ margin: "0 0 12px" }}>
          {conMaquina ? t("sinEstilistasMaquina") : t("sinEstilistas")}
        </p>
      ) : (
        <div className="chips">
          {(ofrecidos ?? []).map((p) => (
            <Chip
              key={p.profesionalId}
              selected={reserva.estilistaId === p.profesionalId}
              onClick={() => elegirProfesional(p)}
            >
              {p.nombre}
            </Chip>
          ))}
          {/* Con máquina no se ofrece: "la primera disponible" es justo donde
              el servidor elige por su cuenta, y el servidor no sabe quién usa
              máquina —la lista vive acá—. Dejarlo sería ofrecer un camino que
              puede terminar con la clienta sentada frente a alguien que solo
              corta con tijera. */}
          {!conMaquina && (
            <Chip selected={reserva.estilistaId === null} onClick={() => elegirProfesional(null)}>
              {t("primeraDisp")}
            </Chip>
          )}
        </div>
      )}
      {/* Solo cuando de verdad hay a quién escoger: junto al aviso de "nadie
          disponible" se contradecía, y debajo de una lista que aún no llega
          explica algo que no está en pantalla. */}
      {conMaquina && !!ofrecidos?.length && (
        <p className="sub" style={{ margin: "0 0 12px" }}>{t("maquinaQuienes")}</p>
      )}

      <Label>{t("dia")}</Label>
      <div className="days">
        {dias.map((d) => {
          const iso = aISO(d);
          // Que falte la respuesta no es lo mismo que no haber: mientras
          // llega, ningún día se desactiva.
          const vacio = cupoPorDia[iso] === false;
          return (
            <button
              key={iso}
              className={`day${iso === fecha ? " sel" : ""}`}
              disabled={vacio}
              aria-label={vacio ? `${d.getDate()} — ${t("sinHoras")}` : undefined}
              onClick={() => actualizar({ fecha: iso, hora: null })}
            >
              <div className="dw">{DOW[lang][d.getDay()]}</div>
              <div className="dn">{d.getDate()}</div>
              <div className="dm">{MON[lang][d.getMonth()]}</div>
            </button>
          );
        })}
      </div>

      <div className="calbar">
        <button
          className={`calabrir${calendarioAbierto ? " abierto" : ""}`}
          aria-expanded={calendarioAbierto}
          onClick={() => setCalendarioAbierto((v) => !v)}
        >
          {calendarioAbierto ? t("cerrarCalendario") : t("masFechas")}
        </button>
        {anclaISO && <LinkButton onClick={volverAHoy}>{t("volverAHoy")}</LinkButton>}
      </div>

      {calendarioAbierto && (
        <CalendarioMes
          valor={fecha}
          desde={primerDia}
          hasta={ultimoDia}
          cupoPorDia={cupoPorDia}
          onMes={pedir}
          onElegir={elegirDelCalendario}
        />
      )}

      <Label>{t("horarios")}</Label>
      {horas.fase === "cargando" && (
        <p className="sub" style={{ margin: 0 }}>{t("cargandoHoras")}</p>
      )}
      {horas.fase === "error" && (
        <p className="sub" style={{ margin: 0 }}>{horas.mensaje}</p>
      )}
      {horas.fase === "listo" &&
        (libres.length ? (
          <div className="slots">
            {libres.map((h) => (
              <button
                key={h}
                className={`slot${hora === h ? " sel" : ""}`}
                onClick={() => actualizar({ fecha, hora: h })}
              >
                {h}
              </button>
            ))}
          </div>
        ) : (
          <p className="sub" style={{ margin: 0 }}>{mensajeSinHoras(horas.motivo)}</p>
        ))}

      <Sticky>
        <Button disabled={!hora} onClick={continuar}>
          {hora ? `${t("continuar")} · ${hora}` : t("continuar")}
        </Button>
      </Sticky>
    </>
  );
}
