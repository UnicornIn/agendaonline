import { useBookingFlow } from "../useBookingFlow";
import { optionsFor, resolveOption } from "../../../lib/pricing";
import { requireFields } from "../../../lib/assert";
import { OptionRow, Stack, Sub, Title } from "../../../components/ui";
import type { Service } from "../../../types";

function copyFor(svc: Service): [title: string, sub: string] {
  if (svc.needsColor)
    return ["¿Qué tipo de color buscas?", "El tiempo cambia según si tu cabello está natural o tiene un proceso químico previo."];
  if (svc.needsType)
    return ["¿Express o detallada?", "La express es más rápida. La detallada incluye mascarilla y definición rizo a rizo."];
  return ["Elige tu opción", ""];
}

export default function OptionsPage() {
  const { catalog, chooseOption, ...flow } = useBookingFlow();
  const booking = requireFields(flow.booking, ["svc"]);
  const list = optionsFor(catalog, booking.svc, booking.easy);
  const [title, sub] = copyFor(catalog.services[booking.svc]);

  return (
    <>
      <Title style={{ marginTop: 14 }}>{title}</Title>
      <Sub>{sub}</Sub>
      <Stack>
        {list.map((o) => {
          const r = resolveOption(catalog, o, booking);
          return (
            <OptionRow
              key={o.id}
              title={o.label}
              desc={`${o.desc ? o.desc + " · " : ""}${r.time}`}
              price={r.price}
              onClick={() => chooseOption(o)}
            />
          );
        })}
      </Stack>
    </>
  );
}
