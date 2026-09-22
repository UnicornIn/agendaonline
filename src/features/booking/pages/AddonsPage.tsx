import { useBookingFlow } from "../useBookingFlow";
import { PATHS } from "../../../router/paths";
import { requireFields } from "../../../lib/assert";
import {
  computeTotal, findOption, fullOptionFor, hasExtra, resolveExtraId, resolveOption, toggleExtra,
} from "../../../lib/pricing";
import { Button, Callout, Kicker, OptionRow, Stack, Sticky, Sub, Title } from "../../../components/ui";

export default function AddonsPage() {
  const { catalog, update, navigate, switchToFull, ...flow } = useBookingFlow();
  const booking = requireFields(flow.booking, ["svc", "opt"]);
  const total = computeTotal(catalog, booking);

  // Complementos del servicio que existen en el catálogo
  const addons = (catalog.extras[booking.svc] ?? []).flatMap(([k, id]) => {
    const option = findOption(catalog, k, resolveExtraId(id, booking.easy));
    return option ? [{ k, id, option }] : [];
  });

  // Corte + definición juntos = mejor tomar el Full
  const duo =
    (booking.svc === "corte" && booking.extras.some((e) => e.k === "definicion")) ||
    (booking.svc === "definicion" && booking.extras.some((e) => e.k === "corte"));
  const full = resolveOption(catalog, fullOptionFor(catalog, booking.easy), booking);

  return (
    <>
      <Kicker style={{ marginTop: 14 }}>{booking.opt.label}</Kicker>
      <Title>¿Agregas algo más<br />a tu cita?</Title>
      <Sub>Se hacen el mismo día, uno después del otro. Sumamos el tiempo a tu bloque para que alcance.</Sub>

      <Stack>
        {addons.map(({ k, id, option }) => {
          const r = resolveOption(catalog, option, booking);
          return (
            <OptionRow
              key={k + id}
              selectable
              selected={hasExtra(booking, k, id)}
              title={option.label}
              desc={`${catalog.services[k].name} · +${r.time}`}
              price={`+${r.price}`}
              onClick={() => update({ extras: toggleExtra(booking, k, id) })}
            />
          );
        })}
      </Stack>

      {duo && (
        <Callout>
          <b>Ojo, hay mejor camino.</b> Corte y definición juntos son el Servicio Full: {full.price} en {full.time}, con
          rizotipo incluido.
          <Button variant="ghost" style={{ marginTop: 11, padding: 12 }} onClick={switchToFull}>Cambiar al Servicio Full</Button>
        </Callout>
      )}

      <Sticky>
        <Button onClick={() => navigate(PATHS.date)}>
          {booking.extras.length ? `Continuar · ${total.price} · ${total.time}` : "Continuar sin agregar"}
        </Button>
      </Sticky>
    </>
  );
}
