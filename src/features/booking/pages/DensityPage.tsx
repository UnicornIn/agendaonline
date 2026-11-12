import { useNavigate } from "react-router-dom";
import { buscarServicio, densidadesDe, PISTA_DENSIDAD } from "../../../data/catalog";
import { FOTO_DENSIDAD } from "../../../data/fotos";
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

  // Una familia sin eje de plasticidad —el color— no pasa por el paso 2: ahí
  // las dos opciones valen lo mismo y duran lo mismo, así que preguntarlo es
  // pedirle a la clienta que decida algo que no decide nada.
  const elegir = (d: Densidad) => {
    actualizar({ dens: d });
    navigate(s?.sinPlasticidad ? PATHS.detail : PATHS.plasticity);
  };

  return (
    <>
      <Kicker style={{ marginTop: 14 }}>{t(s?.sinPlasticidad ? "pasoUnico" : "paso1")}</Kicker>
      <TitleHtml html={t("densTitulo")} />
      <Sub>{t("densSub")}</Sub>
      <div className="four">
        {densidadesDe(s!).map((d) => (
          <MediaCard
            key={d}
            name={d}
            foto={FOTO_DENSIDAD[d]}
            hint={PISTA_DENSIDAD[d][lang === "es" ? 0 : 1]}
            onClick={() => elegir(d)}
          />
        ))}
      </div>
      <Callout>{t("densNota")}</Callout>
    </>
  );
}
