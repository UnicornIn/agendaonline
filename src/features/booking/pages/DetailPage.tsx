import { useNavigate } from "react-router-dom";
import { ABONO, adicionalesDe, buscarServicio, ETIQUETA_GRUPO } from "../../../data/catalog";
import { useApp } from "../../../context/AppContext";
import { PATHS } from "../../../router/paths";
import { hhmm, money, resolver } from "../../../lib/pricing";
import {
  BlockNote, Button, Callout, CheckList, Html, Kicker, Label, PriceBox, Sticky, Title,
} from "../../../components/ui";

/**
 * El detalle del servicio: qué cuesta, cuánto dura y qué incluye.
 *
 * Con diagnóstico el precio es exacto y se dice ("tu valor"); sin él es el
 * rango del catálogo y se dice que la duración es aproximada. La diferencia
 * importa: un rango presentado como cifra final es una discusión en la caja.
 */
export default function DetailPage() {
  const navigate = useNavigate();
  const { t, lang, reserva } = useApp();
  const s = buscarServicio(reserva.svc)!;
  const r = resolver(s, reserva.dens, reserva.plast);

  const incluye = (s.incluye ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  const pie = r.exacto
    ? `${t("tuValor")}${r.mins ? ` · ${hhmm(r.mins)}` : ""}`
    : s.tiempo ? `${t("duracionAprox")} · ${s.tiempo}` : "";

  const siguiente = adicionalesDe(s).length ? PATHS.extras : PATHS.date;

  return (
    <>
      <Kicker style={{ marginTop: 14 }}>{ETIQUETA_GRUPO[lang][s.grupo] ?? s.grupo}</Kicker>
      <Title>{s.nombre}</Title>
      <PriceBox price={r.precio} caption={pie} />

      {incluye.length > 0 && (
        <>
          <Label>{t("queIncluye")}</Label>
          <CheckList items={incluye} />
        </>
      )}

      {r.exacto && r.mins && (
        <BlockNote icon="⏱"><Html html={t("reservamos", { "%t": hhmm(r.mins) })} /></BlockNote>
      )}
      {s.nota && <Callout>{s.nota}</Callout>}
      <BlockNote><Html html={t("avisoAbono", { "%a": money(ABONO) })} /></BlockNote>

      <Sticky>
        <Button onClick={() => navigate(siguiente)}>{t("continuar")}</Button>
      </Sticky>
    </>
  );
}
