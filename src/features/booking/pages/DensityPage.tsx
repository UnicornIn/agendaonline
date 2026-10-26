import { useNavigate } from "react-router-dom";
import { buscarServicio, densidadesDe, PISTA_DENSIDAD } from "../../../data/catalog";
import { useApp } from "../../../context/AppContext";
import { PATHS } from "../../../router/paths";
import { Callout, Kicker, MediaCard, Sub, TitleHtml } from "../../../components/ui";
import type { Densidad } from "../../../types";

/**
 * Paso 1 del diagnóstico: cuánto cabello hay.
 *
 * Solo se ofrecen las densidades que ESE servicio tiene en su matriz: ofrecer
 * una sin fila daría un precio que no existe, y la clienta se enteraría al
 * final.
 */
export default function DensityPage() {
  const navigate = useNavigate();
  const { t, lang, reserva, actualizar } = useApp();
  const s = buscarServicio(reserva.svc);

  const elegir = (d: Densidad) => {
    actualizar({ dens: d });
    navigate(PATHS.plasticity);
  };

  return (
    <>
      <Kicker style={{ marginTop: 14 }}>{t("paso1")}</Kicker>
      <TitleHtml html={t("densTitulo")} />
      <Sub>{t("densSub")}</Sub>
      <div className="four">
        {densidadesDe(s!).map((d) => (
          <MediaCard
            key={d}
            name={d}
            hint={PISTA_DENSIDAD[d][lang === "es" ? 0 : 1]}
            onClick={() => elegir(d)}
          />
        ))}
      </div>
      <Callout>{t("densNota")}</Callout>
    </>
  );
}
