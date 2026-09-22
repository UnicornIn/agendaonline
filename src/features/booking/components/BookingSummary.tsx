import { business } from "../../../config";
import { money } from "../../../lib/format";
import { prettyISO } from "../../../lib/dates";
import { balanceText, computeTotal, depositFor, plasticityText } from "../../../lib/pricing";
import { SummaryTable, type SummaryRow } from "../../../components/ui";
import type { Catalog, ScheduledBooking } from "../../../types";

interface BookingSummaryProps {
  catalog: Catalog;
  booking: ScheduledBooking;
  /** "confirm" = antes de reservar · "done" = cupo apartado */
  variant?: "confirm" | "done";
}

export default function BookingSummary({ catalog, booking, variant = "confirm" }: BookingSummaryProps) {
  const t = computeTotal(catalog, booking);
  const svcLabel = `Servicio${booking.extras.length ? "s" : ""}`;

  const rows: Array<SummaryRow | null> =
    variant === "done"
      ? [
          [svcLabel, t.labels.join(" + ")],
          ["Cuándo", `${prettyISO(booking.date)} · ${booking.time.label}`],
          ["Valor", t.price],
          ["Duración", t.time],
          ["Abono", money(depositFor(booking))],
          ["Pagas en el salón", balanceText(catalog, booking)],
        ]
      : [
          [svcLabel, t.labels.join(" + ")],
          ["Valor", t.price],
          ["Duración", t.time],
          ["Fecha", prettyISO(booking.date)],
          ["Hora", booking.time.label],
          booking.dens ? ["Tu cabello", `Densidad ${booking.dens.toLowerCase()} · ${plasticityText(booking.easy)}`] : null,
          ["Sede", `${business.branch.name}, ${business.branch.city}`],
        ];

  return <SummaryTable rows={rows} />;
}
