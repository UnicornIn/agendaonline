import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { agendaApi, type ProfesionalApi } from "../../../api/agenda";
import { useApp } from "../../../context/AppContext";
import { PATHS } from "../../../router/paths";
import { calcularTotal } from "../../../lib/pricing";
import { aISO, DOW, MON, proximosDias } from "../../../lib/dates";
import { Button, Chip, Kicker, Label, Sticky, Sub, Title } from "../../../components/ui";

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
 * distinto cada una: que la sede no abra el domingo y que el martes esté lleno
 * llevan a la clienta a hacer cosas distintas.
 */

/** Lo que acepta `GET /disponibilidad/dias` de una sola vez. */
const MAX_DIAS_CONSULTA = 16;

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

  const dias = useMemo(() => proximosDias(), []);
  const fecha = reserva.fecha ?? aISO(dias[0]);

  const [profesionales, setProfesionales] = useState<ProfesionalApi[] | null>(null);
  const [diasConCupo, setDiasConCupo] = useState<Set<string> | null>(null);
  const [horas, setHoras] = useState<EstadoHoras>({ fase: "cargando" });

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

  /* ---- qué días tienen algo, para no dejarla tocar uno por uno ---- */
  useEffect(() => {
    if (!idsClave || !dias.length) return;
    let vigente = true;
    // El backend acepta un rango de 16 días como máximo, y los 16 días hábiles
    // que ofrece el selector abarcan más de 16 en el calendario porque se
    // saltan los domingos. Se pide lo que cabe; los días de más se quedan
    // habilitados, que es el lado correcto en el que equivocarse: peor sería
    // apagarlos sin saber si tienen cupo.
    const desde = dias[0];
    const tope = new Date(desde);
    tope.setDate(tope.getDate() + MAX_DIAS_CONSULTA - 1);
    const hasta = dias[dias.length - 1] < tope ? dias[dias.length - 1] : tope;

    agendaApi
      .dias(aISO(desde), aISO(hasta), idsClave.split(","))
      .then((lista) => {
        if (!vigente) return;
        setDiasConCupo(new Set(lista.filter((d) => d.hayCupo).map((d) => d.fecha)));
      })
      // Si falla, ningún día se pinta en gris. Es peor dejarlos todos
      // apagados: la clienta no podría ni intentar.
      .catch(() => vigente && setDiasConCupo(null));
    return () => {
      vigente = false;
    };
  }, [idsClave, dias]);

  /* ---- si hoy ya no da, se corre al primer dia que si ---- */
  useEffect(() => {
    // Solo mientras ella no haya tocado ningun dia. Despues de eso manda su
    // eleccion, aunque el dia se quede sin cupos mientras decide.
    if (reserva.fecha || diasConCupo === null) return;
    const primero = dias.map(aISO).find((iso) => diasConCupo.has(iso));
    if (primero && primero !== fecha) actualizar({ fecha: primero, hora: null });
  }, [diasConCupo, dias, fecha, reserva.fecha, actualizar]);

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

  const kicker = [total.labels.join(" + "), total.tiempo && t("bloqueDe", { "%t": total.tiempo })]
    .filter(Boolean).join(" · ");

  const mensajeSinHoras = (motivo: string | null): string => {
    if (motivo === "sede_cerrada" || motivo === "fecha_pasada") return t("sedeCerrada");
    if (motivo === "sin_horarios") return t("sinEstilistas");
    return t("sinHoras");
  };

  return (
    <>
      <Kicker style={{ marginTop: 14 }}>{kicker}</Kicker>
      <Title>{t("fechaTitulo")}</Title>
      <Sub>{t("fechaSub")}</Sub>

      <Label style={{ marginTop: 2 }}>{t("conQuien")}</Label>
      {profesionales?.length === 0 ? (
        <p className="sub" style={{ margin: "0 0 12px" }}>{t("sinEstilistas")}</p>
      ) : (
        <div className="chips">
          {(profesionales ?? []).map((p) => (
            <Chip
              key={p.profesionalId}
              selected={reserva.estilistaId === p.profesionalId}
              onClick={() => elegirProfesional(p)}
            >
              {p.nombre}
            </Chip>
          ))}
          <Chip selected={reserva.estilistaId === null} onClick={() => elegirProfesional(null)}>
            {t("primeraDisp")}
          </Chip>
        </div>
      )}

      <Label>{t("dia")}</Label>
      <div className="days">
        {dias.map((d) => {
          const iso = aISO(d);
          // `null` = todavía no sabemos, y no saber no es lo mismo que no
          // haber: mientras llega la respuesta ningún día se desactiva.
          const vacio = diasConCupo !== null && !diasConCupo.has(iso);
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
        <Button disabled={!hora} onClick={() => navigate(PATHS.confirm)}>
          {hora ? `${t("continuar")} · ${hora}` : t("continuar")}
        </Button>
      </Sticky>
    </>
  );
}
