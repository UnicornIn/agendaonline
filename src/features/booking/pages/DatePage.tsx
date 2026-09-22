import { useEffect, useMemo } from "react";
import { useBookingFlow } from "../useBookingFlow";
import { useAvailability } from "../useAvailability";
import { PATHS } from "../../../router/paths";
import { requireFields } from "../../../lib/assert";
import { computeTotal } from "../../../lib/pricing";
import { toISODate, upcomingDays } from "../../../lib/dates";
import DayPicker from "../components/DayPicker";
import SlotGrid from "../components/SlotGrid";
import { Button, Kicker, Label, Sticky, Sub, Title } from "../../../components/ui";

export default function DatePage() {
  const { catalog, update, navigate, ...flow } = useBookingFlow();
  const booking = requireFields(flow.booking, ["svc", "opt"]);
  const total = computeTotal(catalog, booking);
  const days = useMemo(() => upcomingDays(), []);
  const date = booking.date ?? toISODate(days[0]);
  const { slots, loading, error } = useAvailability(date, total.mins);

  // Si la hora elegida ya no está libre en el día seleccionado, se limpia
  useEffect(() => {
    if (loading || !booking.time) return;
    const stillFree = slots.some((s) => s.label === booking.time?.label && s.available);
    if (!stillFree) update({ time: null });
  }, [slots, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Kicker style={{ marginTop: 14 }}>{total.labels.join(" + ")} · bloque de {total.time}</Kicker>
      <Title>Elige fecha y hora</Title>
      <Sub>Disponibilidad real de Agenda RF. Solo ves horarios donde tu servicio cabe completo antes de cerrar.</Sub>

      <DayPicker days={days} value={date} onChange={(d) => update({ date: d })} />

      <Label>Horarios disponibles</Label>
      <SlotGrid
        slots={slots}
        loading={loading}
        error={error}
        value={booking.time?.label}
        onChange={(s) => update({ date, time: { label: s.label, start: s.start } })}
      />

      <Sticky>
        <Button disabled={!booking.time || loading} onClick={() => navigate(PATHS.confirm)}>Continuar</Button>
      </Sticky>
    </>
  );
}
