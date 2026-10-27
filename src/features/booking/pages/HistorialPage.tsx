import { Navigate, useNavigate } from "react-router-dom";
import { adicionalesDe, anclaGrupo, buscarServicio } from "../../../data/catalog";
import { useApp } from "../../../context/AppContext";
import { useHistorial } from "../useHistorial";
import { hhmm, resolver } from "../../../lib/pricing";
import { PATHS } from "../../../router/paths";
import { Button, Kicker, LinkButton, Sub, TitleHtml } from "../../../components/ui";
import type { ServicioPasado } from "../../../types";

/**
 * Lo que ya se ha hecho, para repetirlo en un toque.
 *
 * Cada servicio se repinta contra el catálogo de hoy —precio y duración salen
 * de `resolver`, no de la cita vieja—: mostrar el valor de agosto en octubre
 * es prometer algo que la caja no va a cobrar.
 */
export default function HistorialPage() {
  const navigate = useNavigate();
  const { t, lang, actualizar } = useApp();
  const { historial, olvidar } = useHistorial();

  // Un refresh en esta ruta sin historial en sesión: se vuelve a identificar.
  if (!historial) return <Navigate to={PATHS.ident} replace />;

  const plastTxt = (p: "pa" | "pb" | null) =>
    p === "pa" ? t("soloSe").toLowerCase() : t("ayuda").toLowerCase();

  /**
   * Repetir salta el diagnóstico cuando lo sabemos, y lo pregunta cuando no.
   *
   * No siempre lo sabemos. Hay servicios viejos que la agenda no partía por
   * densidad ni por plasticidad —"X SOLO DEFINICION ALTA" es uno— y de esos
   * se deduce la tarjeta pero no el escalón. Mandarla derecho a la fecha con
   * el escalón en blanco la deja en una pantalla sin horas, porque sin
   * `servicio_id` no hay nada que preguntarle a la agenda. Así que se le
   * pregunta lo que falte, igual que a quien entra por el menú.
   */
  function repetir(pasado: ServicioPasado) {
    const s = buscarServicio(pasado.svc);
    const falta = s?.matriz && !resolver(s, historial!.dens, historial!.plast).exacto;
    actualizar({
      svc: pasado.svc,
      extras: [...pasado.extras],
      repite: true,
      dens: historial!.dens,
      plast: historial!.plast,
      estilista: historial!.estilista,
      fecha: null,
      hora: null,
    });
    if (falta) {
      navigate(historial!.dens ? PATHS.plasticity : PATHS.density);
      return;
    }
    navigate(adicionalesDe(s).length ? PATHS.extras : PATHS.date);
  }

  /** "Era de u\u00f1as, pero no s\u00e9 cu\u00e1l": al men\u00fa, abierto en ese grupo. */
  function escoger(pasado: ServicioPasado) {
    actualizar({ extras: [], repite: false, svc: null });
    navigate(`${PATHS.menu}#${anclaGrupo(pasado.grupo!)}`);
  }

  function otroServicio() {
    actualizar({ extras: [], repite: false, svc: null });
    navigate(PATHS.menu);
  }

  function noSoyYo() {
    olvidar();
    actualizar({ nombre: "", estilista: null, dens: null, plast: null, correo: "", tel: "" });
    navigate(PATHS.ident);
  }

  return (
    <>
      <Kicker style={{ marginTop: 14 }}>{t("holaX", { "%s": historial.nombre.split(" ")[0] })}</Kicker>
      <TitleHtml html={t("histTitulo")} />
      <Sub>
        {historial.ultimaVisita
          ? t("ultimaVez", { "%s": historial.ultimaVisita })
          : t("yaNosConoces")}
      </Sub>

      {/* Solo los datos que de verdad vinieron. La agenda no siempre sabe
          quién la atendió —la cita puede estar a nombre de alguien que ya no
          trabaja en la sede— y "Tu estilista:" seguido de nada se lee como
          una página rota. Si no viene ninguno de los dos, no hay perfil. */}
      {(historial.estilista || historial.dens) && (
        <div className="perfil">
          <b>{t("tuPerfil")}</b>
          {[
            historial.estilista && (
              <>{t("tuEstilista")}: <span className="quien">{historial.estilista}</span></>
            ),
            historial.dens && (
              <>{t("tuCabello")}: {lang === "es" ? "densidad" : "density"}{" "}
                {historial.dens.toLowerCase()} · {plastTxt(historial.plast)}</>
            ),
          ]
            .filter(Boolean)
            .map((parte, i) => (
              <span key={i}>{i > 0 && " · "}{parte}</span>
            ))}
        </div>
      )}

      {/* Reconocida y sin nada que repetir. Pasa cuando todo su historial son
          servicios que el catálogo web no ofrece —color, uñas sin especificar,
          los nombres viejos que nadie emparejó— y sin este aviso la pantalla
          queda en blanco debajo del saludo: se lee como una página rota, no
          como una respuesta. */}
      {historial.servicios.length === 0 && (
        <p className="sub" style={{ margin: "4px 0 0" }}>{t("sinRepetibles")}</p>
      )}

      {historial.servicios.map((pasado) => {
        if (pasado.grupo) {
          return (
            <div className="hist" key={`grupo-${pasado.grupo}`}>
              <div className="hs">{pasado.nombre}</div>
              <div className="hm">{pasado.fecha}</div>
              <div className="hr">
                <Button size="sm" style={{ flex: 1 }} onClick={() => escoger(pasado)}>
                  {t("escogerCual")}
                </Button>
              </div>
            </div>
          );
        }
        const s = buscarServicio(pasado.svc);
        if (!s) return null;
        const r = resolver(s, historial.dens, historial.plast);
        const meta = [pasado.fecha, pasado.extras.join(", "), r.mins ? hhmm(r.mins) : ""]
          .filter(Boolean).join(" · ");
        return (
          <div className="hist" key={`${pasado.svc}-${pasado.fecha}`}>
            <div className="hs">{s.nombre}</div>
            <div className="hm">{meta}</div>
            <div className="hr">
              <Button size="sm" style={{ flex: 1 }} onClick={() => repetir(pasado)}>{t("repetir")}</Button>
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>{r.precio}</span>
            </div>
          </div>
        );
      })}

      <Button variant="ghost" style={{ marginTop: 12 }} onClick={otroServicio}>{t("otroServicio")}</Button>
      <LinkButton onClick={noSoyYo}>{t("noSoyYo")}</LinkButton>
    </>
  );
}
