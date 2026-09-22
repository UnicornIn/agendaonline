import { useBookingFlow } from "../useBookingFlow";
import { business } from "../../../config";
import { PATHS } from "../../../router/paths";
import { firstName } from "../../../lib/format";
import { requireFields } from "../../../lib/assert";
import { computeTotal } from "../../../lib/pricing";
import { downloadICS } from "../../../lib/calendar";
import BookingSummary from "../components/BookingSummary";
import type { StartPageState } from "./StartPage";
import { BigTickIcon } from "../../../components/ui/Icons";
import { Button, Note, Stack, Sub } from "../../../components/ui";

export default function DonePage() {
  const { catalog, navigate, ...flow } = useBookingFlow();
  const booking = requireFields(flow.booking, ["svc", "opt", "date", "time"]);
  const t = computeTotal(catalog, booking);

  const addToCalendar = () =>
    downloadICS({
      title: `${business.brand}: ${t.labels.join(" + ")}`,
      date: booking.date,
      startMins: booking.time.start,
      durationMins: t.mins,
      location: `${business.brand} · Sede ${business.branch.name}, ${business.branch.city}`,
      description: `Valor ${t.price}. Reserva ${booking.bookingId ?? ""}`,
    });

  // La portada limpia la reserva al montarse: limpiarla aquí haría que el guard de esta ruta redirija al menú
  const again = () => navigate(PATHS.start, { replace: true, state: { resetBooking: true } satisfies StartPageState });

  return (
    <>
      <div className="done">
        <div className="tick"><BigTickIcon /></div>
        <h1 className="title" style={{ fontSize: 30 }}>Cupo apartado</h1>
        <Sub>
          Listo, {firstName(booking.name)}. Confirmamos tu cita apenas verifiquemos el comprobante, y te escribimos por WhatsApp.
        </Sub>
      </div>
      <BookingSummary catalog={catalog} booking={booking} variant="done" />
      <Stack>
        <Button variant="ghost" onClick={addToCalendar}>Agregar a mi calendario</Button>
        <Button variant="ghost" onClick={again}>Agendar otra cita</Button>
      </Stack>
      <Note>
        Reserva {booking.bookingId ? <b>{booking.bookingId}</b> : "creada"} en Agenda RF (TAP), pendiente de verificar el abono.
      </Note>
    </>
  );
}
