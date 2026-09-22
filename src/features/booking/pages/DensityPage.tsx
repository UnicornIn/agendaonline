import { useBookingFlow } from "../useBookingFlow";
import { DENSITY_OPTIONS } from "../../../data/diagnosis";
import { requireFields } from "../../../lib/assert";
import { Callout, Kicker, MediaCard, Sub, Title } from "../../../components/ui";

export default function DensityPage() {
  const flow = useBookingFlow();
  const booking = requireFields(flow.booking, ["svc"]);
  const twoSteps = flow.catalog.services[booking.svc].diag === "full";

  return (
    <>
      <Kicker style={{ marginTop: 14 }}>Paso 1 de {twoSteps ? 2 : 1} · Tu cabello</Kicker>
      <Title>¿Cuánto cabello<br />tienes?</Title>
      <Sub>
        A eso le decimos densidad: no es qué tan grueso es cada hilo, sino cuántos hilos tienes. Mira los videos y toca
        el que se parezca al tuyo, suelto y seco.
      </Sub>
      <div className="four">
        {DENSITY_OPTIONS.map((o) => (
          <MediaCard key={o.value} name={o.value} hint={o.hint} video={o.video} onClick={() => flow.setDensity(o.value)} />
        ))}
      </div>
      <Callout>
        Con esto calculamos tu valor exacto y cuánto tiempo reservamos de la agenda de tu estilista, para que nadie quede corriendo.
      </Callout>
    </>
  );
}
