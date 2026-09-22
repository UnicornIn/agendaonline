import { useBookingFlow } from "../useBookingFlow";
import { fullOptionFor } from "../../../lib/pricing";
import { HeroCard, Label, Note, ServiceCard, Sub, Title } from "../../../components/ui";

export default function MenuPage() {
  const { catalog, chooseService } = useBookingFlow();
  const full = fullOptionFor(catalog, true);
  const others = catalog.order.filter((k) => k !== "full");

  return (
    <>
      <Title style={{ marginTop: 14 }}>¿Qué servicio deseas?</Title>
      <Sub>Empieza por el completo o elige uno suelto.</Sub>

      <HeroCard
        name="Servicio Full"
        desc="Corte, lavado, mascarilla, definición detallada, secado y tu rizotipo en PDF. Todo tu cabello resuelto en una sola cita."
        meta={`desde ${catalog.services.full.from} · ${full.time}`}
        onClick={() => chooseService("full")}
      />
      <p className="whyfull">
        Tomar el corte y la definición detallada por separado cuesta entre {catalog.bundle.easy.separatePrice} y toma{" "}
        {catalog.bundle.easy.separateTime}. En el Full van juntos, en menos tiempo.
      </p>

      <Label>Otros servicios</Label>
      <div className="grid">
        {others.map((k) => (
          <ServiceCard key={k} name={catalog.services[k].name} from={catalog.services[k].from} onClick={() => chooseService(k)} />
        ))}
      </div>
      <Note>Los precios varían según el largo y la densidad de tu cabello.</Note>
    </>
  );
}
