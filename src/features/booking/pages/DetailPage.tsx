import { useBookingFlow } from "../useBookingFlow";
import { PATHS } from "../../../router/paths";
import { money } from "../../../lib/format";
import { requireFields } from "../../../lib/assert";
import { bundleInfo, depositFor, plasticityText, resolveOption } from "../../../lib/pricing";
import { BlockNote, Button, Callout, CheckList, Kicker, Label, PriceBox, Sticky, Title } from "../../../components/ui";
import type { Catalog, PricedBooking } from "../../../types";

interface FullBridgeProps {
  catalog: Catalog;
  booking: PricedBooking;
  onSwitch: () => void;
}

/** Puente de venta hacia el Servicio Full */
function FullBridge({ catalog, booking, onSwitch }: FullBridgeProps) {
  const { full, separatePrice, separateTime } = bundleInfo(catalog, booking.easy !== false);

  if (booking.svc === "full") {
    return (
      <Callout>
        <b>Por qué conviene junto.</b> El corte y la definición detallada por separado suman entre {separatePrice} y toman{" "}
        {separateTime}. El Full incluye los dos por {full.price} en {full.time}, con el rizotipo incluido.
      </Callout>
    );
  }
  if (booking.svc === "corte" || booking.svc === "definicion") {
    const missing = booking.svc === "corte" ? "definición detallada" : "corte";
    return (
      <Callout>
        <b>¿También quieres {missing}?</b> Tomarlos por separado suma entre {separatePrice} en {separateTime}. El Servicio
        Full incluye los dos por {full.price} en {full.time}.
        <Button variant="ghost" style={{ marginTop: 11, padding: 12 }} onClick={onSwitch}>Ver el Servicio Full</Button>
      </Callout>
    );
  }
  return null;
}

export default function DetailPage() {
  const { catalog, navigate, switchToFull, ...flow } = useBookingFlow();
  const booking = requireFields(flow.booking, ["svc", "opt"]);
  const o = booking.opt;
  const r = resolveOption(catalog, o, booking);

  return (
    <>
      <Kicker style={{ marginTop: 14 }}>{catalog.services[booking.svc].name}</Kicker>
      <Title>{o.label}</Title>
      <PriceBox
        price={r.price}
        caption={r.exact ? `Tu valor, calculado con tu diagnóstico · ${r.time}` : `Duración aproximada · ${r.time}`}
      />
      <BlockNote>
        Para apartar tu cita se abona <b>{money(depositFor(booking))}</b>, que se descuentan del valor total.
      </BlockNote>
      {r.exact && booking.dens && (
        <BlockNote icon="⏱">
          Reservamos <b>{r.time}</b> de la agenda de tu estilista: densidad {booking.dens.toLowerCase()} con rizo que{" "}
          {plasticityText(booking.easy)} pide ese tiempo.
        </BlockNote>
      )}

      <Label>Qué incluye</Label>
      <CheckList items={o.includes} />
      {o.note && <Callout>{o.note}</Callout>}

      <FullBridge catalog={catalog} booking={booking} onSwitch={switchToFull} />

      {booking.dens ? (
        <Callout>
          <b>Tu diagnóstico:</b> densidad {booking.dens.toLowerCase()} · el rizo {plasticityText(booking.easy)}. Va con tu
          cita para que la estilista lo tenga antes de que llegues.
        </Callout>
      ) : (
        <Callout>El valor final depende del largo y la densidad de tu cabello. Te lo confirman en el salón antes de comenzar.</Callout>
      )}

      <Sticky>
        <Button onClick={() => navigate(PATHS.addons)}>Continuar</Button>
      </Sticky>
    </>
  );
}
