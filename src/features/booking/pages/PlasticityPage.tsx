import { useNavigate } from "react-router-dom";
import { buscarServicio, plasticidadDisponible } from "../../../data/catalog";
import { FOTO_PLASTICIDAD } from "../../../data/fotos";
import { useApp } from "../../../context/AppContext";
import { PATHS } from "../../../router/paths";
import { Callout, Kicker, MediaCard, Sub, TitleHtml } from "../../../components/ui";
import type { Plasticidad } from "../../../types";

/**
 * Paso 2 del diagnóstico: qué tanto le cuesta formarse al rizo.
 *
 * Una plasticidad que el servicio no presta se muestra desactivada en vez de
 * esconderse: que exista y no aplique es información —"definición sencilla no
 * es para plasticidad baja"— y esconderla deja a la clienta preguntándose por
 * qué solo hay una opción. Por eso el callout muestra la nota del servicio
 * cuando una de las dos está cerrada.
 */
export default function PlasticityPage() {
  const navigate = useNavigate();
  const { t, reserva, actualizar } = useApp();
  const s = buscarServicio(reserva.svc)!;

  const hayPa = plasticidadDisponible(s, "pa");
  const hayPb = plasticidadDisponible(s, "pb");

  const elegir = (p: Plasticidad) => {
    actualizar({ plast: p });
    navigate(PATHS.detail);
  };

  return (
    <>
      <Kicker style={{ marginTop: 14 }}>{t("paso2")}</Kicker>
      <TitleHtml html={t("plastTitulo")} />
      <Sub>{t("plastSub")}</Sub>
      <div className="two">
        <MediaCard
          name={t("soloSe")} hint={t("soloSeH")} foto={FOTO_PLASTICIDAD.pa}
          disabled={!hayPa} onClick={() => elegir("pa")}
        />
        <MediaCard
          name={t("ayuda")} hint={t("ayudaH")} foto={FOTO_PLASTICIDAD.pb}
          disabled={!hayPb} onClick={() => elegir("pb")}
        />
      </div>
      <Callout>{!hayPa || !hayPb ? s.nota ?? t("dudas") : t("dudas")}</Callout>
    </>
  );
}
