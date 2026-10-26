import { useNavigate } from "react-router-dom";
import {
  buscarServicio, ETIQUETA_GRUPO, NOTA_GRUPO, ORDEN_GRUPOS, serviciosDelGrupo,
} from "../../../data/catalog";
import { useApp } from "../../../context/AppContext";
import { PATHS } from "../../../router/paths";
import {
  BlockNote, GroupLabel, HeroCard, Html, LinkButton, Note, OptionRow, Stack, Sub, Title,
} from "../../../components/ui";

/**
 * El menú completo, agrupado como el salón habla de sus servicios.
 *
 * Si ya sabemos el diagnóstico —porque la clienta entró con su historial— se
 * dice y no se vuelve a preguntar, con un escape por si el cabello cambió. Es
 * la diferencia entre dos toques y seis para quien ya vino.
 */
export default function MenuPage() {
  const navigate = useNavigate();
  const { t, lang, reserva, actualizar } = useApp();

  const full = buscarServicio("full");
  const otrosGrupos = ORDEN_GRUPOS.filter((g) => g !== "Servicio Full");
  const etiqueta = (g: string) => ETIQUETA_GRUPO[lang][g] ?? g;
  const plastTxt = reserva.plast === "pa" ? t("soloSe").toLowerCase() : t("ayuda").toLowerCase();

  /** Un servicio con matriz necesita diagnóstico; sin matriz va derecho al detalle. */
  function elegir(id: string) {
    const s = buscarServicio(id);
    actualizar({ svc: id, extras: [] });
    navigate(s?.matriz && !reserva.dens ? PATHS.density : PATHS.detail);
  }

  return (
    <>
      <Title style={{ marginTop: 14 }}>{t("menuTitulo")}</Title>
      <Sub>{t("menuSub")}</Sub>

      {reserva.dens && (
        <BlockNote icon="✓">
          <Html html={t("yaDiag", { "%d": reserva.dens.toLowerCase(), "%p": plastTxt })} />
          <LinkButton
            style={{ textAlign: "left", padding: "5px 0 0", width: "auto" }}
            onClick={() => actualizar({ dens: null, plast: null })}
          >
            {t("cambio")}
          </LinkButton>
        </BlockNote>
      )}

      {full && (
        <div style={{ marginTop: 14 }}>
          <HeroCard
            tag={etiqueta("Servicio Full")}
            name={full.nombre}
            desc={full.incluye ?? ""}
            price={full.precio ?? ""}
            cta={t("verDetalle")}
            onClick={() => elegir(full.id)}
          />
        </div>
      )}

      {otrosGrupos.map((grupo) => {
        const lista = serviciosDelGrupo(grupo);
        if (!lista.length) return null;
        return (
          <div key={grupo}>
            <GroupLabel>{etiqueta(grupo)}</GroupLabel>
            {NOTA_GRUPO[grupo] && (
              <p className="sub" style={{ margin: "-4px 0 10px", fontSize: 13 }}>{NOTA_GRUPO[grupo]}</p>
            )}
            <Stack>
              {lista.map((s) => (
                <OptionRow key={s.id} title={s.nombre} desc={s.desc} price={s.precio} onClick={() => elegir(s.id)} />
              ))}
            </Stack>
          </div>
        );
      })}

      <Note style={{ marginTop: 22 }}>{t("variaPrecio")}</Note>
    </>
  );
}
