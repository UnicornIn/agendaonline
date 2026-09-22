import { useBookingFlow } from "../useBookingFlow";
import { bookingsApi } from "../../../api";
import { business } from "../../../config";
import { useToast } from "../../../context/ToastContext";
import { PATHS } from "../../../router/paths";
import { money } from "../../../lib/format";
import { prettyISO } from "../../../lib/dates";
import { requireFields } from "../../../lib/assert";
import { balanceText, computeTotal, depositFor, hasColor } from "../../../lib/pricing";
import { Button, Callout, Label, Sticky, Sub, Title } from "../../../components/ui";

export default function DepositPage() {
  const { catalog, navigate, ...flow } = useBookingFlow();
  const booking = requireFields(flow.booking, ["svc", "opt", "date", "time"]);
  const toast = useToast();
  const t = computeTotal(catalog, booking);
  const deposit = depositFor(booking);
  const when = `${prettyISO(booking.date)} a las ${booking.time.label}`;

  const waMsg = `Hola, soy ${booking.name}. Envío el comprobante del abono de ${money(deposit)} para mi cita de ${t.labels.join(" + ")} el ${when} en la sede ${business.branch.name}.`;
  const bookingText = `${t.labels.join(" + ")} · ${prettyISO(booking.date)} · ${booking.time.label} · ${t.price} · abono ${money(deposit)} · ${booking.name} · ${booking.phone} · Sede ${business.branch.name}`;

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copiado");
    } catch {
      toast("No se pudo copiar al portapapeles.");
    }
  }

  async function markSent() {
    try {
      if (booking.bookingId) await bookingsApi.markDepositSent(booking.bookingId);
    } catch {
      // No bloqueamos a la clienta: la sede verifica el comprobante por WhatsApp
    }
    navigate(PATHS.done);
  }

  return (
    <>
      <Title style={{ marginTop: 14 }}>Aparta tu cupo<br />con el abono</Title>
      <Sub>Tu horario queda reservado cuando recibimos el comprobante. El abono se descuenta del valor del servicio.</Sub>

      <div className="amount">
        <div className="lbl">Abono</div>
        <div className="num">{money(deposit)}</div>
        <div className="sub2">
          {hasColor(booking) ? "Color tiene un abono de $90.000 por la separación de insumos." : "Aplica para todos los servicios."}{" "}
          Pagas {balanceText(catalog, booking)} en el salón.
        </div>
      </div>

      <Label>Dónde hacerlo</Label>
      <div className="pay">
        {business.paymentMethods.map((m) => (
          <div className="prow" key={m.id}>
            <div>
              <div className="pm">{m.name}</div>
              <div className="pd">{m.pending ? <span className="pend">{m.detail}</span> : m.detail}</div>
            </div>
            {m.copy && <button className="copy" onClick={() => copy(m.copy!)}>Copiar</button>}
          </div>
        ))}
      </div>

      <Label>Envía el comprobante</Label>
      <Sub style={{ marginBottom: 14 }}>Mándanos el soporte por WhatsApp y te confirmamos la cita.</Sub>
      <a className="btn wa" href={`https://wa.me/${business.whatsapp}?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noopener noreferrer">
        Enviar comprobante por WhatsApp
      </a>
      <Button variant="ghost" style={{ marginTop: 10 }} onClick={() => copy(bookingText)}>Copiar los datos de mi cita</Button>
      <Callout>{business.policies.reschedule}</Callout>

      <Sticky>
        <Button onClick={markSent}>Ya envié el comprobante</Button>
      </Sticky>
    </>
  );
}
