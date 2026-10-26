import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ESTILISTAS } from "../../../data/catalog";
import { useApp } from "../../../context/AppContext";
import { PATHS } from "../../../router/paths";
import { calcularTotal } from "../../../lib/pricing";
import { aISO, DOW, horasLibres, MON, proximosDias } from "../../../lib/dates";
import { Button, Chip, Kicker, Label, Sticky, Sub, Title } from "../../../components/ui";

/**
 * Fecha, hora y con quién.
 *
 * Solo se ofrecen horas donde el bloque COMPLETO cabe antes de cerrar: una
 * cita de tres horas a las 4:30 deja a la clienta en el salón después del
 * cierre, o a la estilista cortando el servicio por la mitad.
 */
export default function DatePage() {
  const navigate = useNavigate();
  const { t, lang, reserva, actualizar } = useApp();

  const total = calcularTotal(reserva);
  const dias = useMemo(() => proximosDias(), []);
  const fecha = reserva.fecha ?? aISO(dias[0]);
  const libres = useMemo(
    () => horasLibres(fecha, total.mins ?? 0, reserva.estilista),
    [fecha, total.mins, reserva.estilista]
  );

  // La hora elegida puede dejar de estar libre al cambiar de día o de
  // estilista: se suelta en vez de llevar una selección que ya no existe.
  const hora = reserva.hora && libres.includes(reserva.hora) ? reserva.hora : null;

  const kicker = [total.labels.join(" + "), total.tiempo && t("bloqueDe", { "%t": total.tiempo })]
    .filter(Boolean).join(" · ");

  return (
    <>
      <Kicker style={{ marginTop: 14 }}>{kicker}</Kicker>
      <Title>{t("fechaTitulo")}</Title>
      <Sub>{t("fechaSub")}</Sub>

      <Label style={{ marginTop: 2 }}>{t("conQuien")}</Label>
      <div className="chips">
        {ESTILISTAS.map((e) => (
          <Chip
            key={e}
            selected={reserva.estilista === e}
            onClick={() => actualizar({ estilista: e, hora: null })}
          >
            {e}
          </Chip>
        ))}
        <Chip selected={reserva.estilista === null} onClick={() => actualizar({ estilista: null, hora: null })}>
          {t("primeraDisp")}
        </Chip>
      </div>

      <Label>{t("dia")}</Label>
      <div className="days">
        {dias.map((d) => {
          const iso = aISO(d);
          return (
            <button
              key={iso}
              className={`day${iso === fecha ? " sel" : ""}`}
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
      {libres.length ? (
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
        <p className="sub" style={{ margin: 0 }}>{t("sinCupo")}</p>
      )}

      <Sticky>
        <Button disabled={!hora} onClick={() => navigate(PATHS.confirm)}>
          {hora ? `${t("continuar")} · ${hora}` : t("continuar")}
        </Button>
      </Sticky>
    </>
  );
}
