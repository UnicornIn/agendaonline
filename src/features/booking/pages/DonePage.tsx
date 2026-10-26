import { useNavigate } from "react-router-dom";
import { ABONO } from "../../../data/catalog";
import { business } from "../../../config";
import { useApp } from "../../../context/AppContext";
import { useHistorial } from "../useHistorial";
import { PATHS } from "../../../router/paths";
import { calcularTotal, money, saldo } from "../../../lib/pricing";
import { fechaISOBonita } from "../../../lib/dates";
import { descargarICS } from "../../../lib/calendar";
import { Button, Stack, Sub, SummaryTable, Title } from "../../../components/ui";
import { BigTickIcon } from "../../../components/ui/Icons";

/**
 * Cita confirmada.
 *
 * El bloque "esto le llegó al agente" solo se pinta en desarrollo. Es una
 * ayuda para revisar qué se manda a la sede, no algo que la clienta tenga que
 * leer: le muestra el mensaje interno del salón —con su celular y la etiqueta
 * de trabajo— en la pantalla donde lo único que espera es que le confirmen la
 * cita.
 */
export default function DonePage() {
  const navigate = useNavigate();
  const { t, lang, reserva, reiniciar } = useApp();
  const { olvidar } = useHistorial();
  const total = calcularTotal(reserva);

  const cuando = `${fechaISOBonita(reserva.fecha, lang)} · ${reserva.hora}`;
  const quien = reserva.estilista ?? t("primeraDisp");
  const restante = saldo(reserva, t("elResto"));

  const aviso = lang === "es"
    ? `Cliente agendó cita\n${reserva.nombre} · ${reserva.pais} ${reserva.tel}\n${total.labels.join(" + ")}\n${cuando} · ${quien}\nValor ${total.precio} · Abono ${money(ABONO)} · Saldo ${restante}\nComprobante adjunto · confirmar abono`
    : `Client booked an appointment\n${reserva.nombre} · ${reserva.pais} ${reserva.tel}\n${total.labels.join(" + ")}\n${cuando} · ${quien}\nTotal ${total.precio} · Deposit ${money(ABONO)} · Balance ${restante}\nReceipt attached · confirm deposit`;

  function agendarOtra() {
    // Se suelta también el historial: la siguiente cita puede ser de otra
    // persona en el mismo celular.
    olvidar();
    reiniciar();
    navigate(PATHS.start, { replace: true });
  }

  function alCalendario() {
    if (!reserva.fecha || !reserva.hora) return;
    descargarICS({
      title: `${business.brand}: ${total.labels.join(" + ")}`,
      date: reserva.fecha,
      hora: reserva.hora,
      durationMins: total.mins || 90,
      location: `${business.brand} · ${t("sede")}`,
      description: `${t("valor")} ${total.precio} · ${t("abono")} ${money(ABONO)}`,
    });
  }

  return (
    <>
      <div className="done">
        <div className="tick"><BigTickIcon /></div>
        <Title style={{ fontSize: 29 }}>{t("listoTitulo")}</Title>
        <Sub>{t("listoSub", { "%s": reserva.nombre.split(" ")[0] })}</Sub>
      </div>

      <SummaryTable
        rows={[
          [reserva.extras.length ? t("servicios") : t("servicio"), total.labels.join(" + ")],
          [t("cuando"), cuando],
          [t("con"), quien],
          [t("valor"), total.precio],
          [t("abono"), money(ABONO)],
          [t("saldo"), restante],
        ]}
      />

      {import.meta.env.DEV && (
        <div className="agente">
          <div className="ah">{t("avisoAgente")}</div>
          <div className="ab">{aviso}</div>
          <span className="etiqueta">{t("etiqueta")}</span>
        </div>
      )}

      <Stack style={{ marginTop: 16 }}>
        <Button variant="ghost" onClick={alCalendario}>{t("calendario")}</Button>
        <Button variant="ghost" onClick={agendarOtra}>{t("agendarOtra")}</Button>
      </Stack>

      <p className="note">{t("reprogramar")}</p>
    </>
  );
}
