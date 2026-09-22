import { useBookingFlow } from "../useBookingFlow";
import { PLASTICITY_OPTIONS } from "../../../data/diagnosis";
import { Callout, Kicker, MediaCard, Sub, Title } from "../../../components/ui";

export default function PlasticityPage() {
  const { setPlasticity } = useBookingFlow();

  return (
    <>
      <Kicker style={{ marginTop: 14 }}>Paso 2 de 2 · Tu cabello</Kicker>
      <Title>¿Tu rizo se forma<br />solo al secarse?</Title>
      <Sub>
        A eso le decimos plasticidad: qué tan fácil tu rizo toma forma. Junto con la densidad, define tu valor y el
        tiempo que reservamos.
      </Sub>
      <div className="two">
        {PLASTICITY_OPTIONS.map((o) => (
          <MediaCard key={o.name} name={o.name} hint={o.hint} video={o.video} onClick={() => setPlasticity(o.value)} />
        ))}
      </div>
      <Callout>Si dudas, elige el que más se parezca. En el salón la estilista confirma el diagnóstico antes de comenzar.</Callout>
    </>
  );
}
