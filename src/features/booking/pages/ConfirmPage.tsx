import { useState } from "react";
import { useBookingFlow } from "../useBookingFlow";
import { toBookingPayload } from "../bookingPayload";
import { bookingsApi } from "../../../api";
import { useToast } from "../../../context/ToastContext";
import { PATHS } from "../../../router/paths";
import { money } from "../../../lib/format";
import { requireFields } from "../../../lib/assert";
import { depositFor } from "../../../lib/pricing";
import { isFullName, isPhone, onlyDigits } from "../../../lib/validation";
import BookingSummary from "../components/BookingSummary";
import { Button, Callout, Field, Sticky, Sub, Title } from "../../../components/ui";

export default function ConfirmPage() {
  const { catalog, update, navigate, ...flow } = useBookingFlow();
  const booking = requireFields(flow.booking, ["svc", "opt", "date", "time"]);
  const toast = useToast();
  const [name, setName] = useState(booking.name);
  const [phone, setPhone] = useState(booking.phone);
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);

  const nameOk = isFullName(name);
  const phoneOk = isPhone(phone);

  async function submit() {
    setTouched(true);
    if (!nameOk || !phoneOk) return;
    const next = { ...booking, name: name.trim(), phone };
    setSending(true);
    try {
      const created = await bookingsApi.create(toBookingPayload(catalog, next));
      update({ ...next, bookingId: created.id });
      navigate(PATHS.deposit);
    } catch (err) {
      toast(err instanceof Error ? err.message : "No pudimos crear la reserva. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Title style={{ marginTop: 14 }}>Confirma tu cita</Title>
      <Sub>Revisa que todo esté bien antes de reservar.</Sub>
      <BookingSummary catalog={catalog} booking={booking} />

      <Field
        id="i-name" label="Nombre completo" autoComplete="name" placeholder="Como aparece en tu documento"
        value={name} onChange={(e) => setName(e.target.value)}
        invalid={touched && !nameOk} error="Escribe tu nombre y apellido."
      />
      <Field
        id="i-phone" label="Celular" inputMode="numeric" autoComplete="tel" placeholder="300 000 0000"
        value={phone} onChange={(e) => setPhone(onlyDigits(e.target.value))}
        invalid={touched && !phoneOk} error="Escribe un celular de 10 dígitos."
      />
      <Callout>Para apartar el cupo se abona {money(depositFor(booking))}. Se descuentan del valor del servicio.</Callout>

      <Sticky>
        <Button onClick={submit} disabled={sending}>{sending ? "Reservando…" : "Continuar al abono"}</Button>
      </Sticky>
    </>
  );
}
