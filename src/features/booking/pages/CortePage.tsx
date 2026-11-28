import { useNavigate } from "react-router-dom";
import { buscarServicio } from "../../../data/catalog";
import { useApp } from "../../../context/AppContext";
import { PATHS } from "../../../router/paths";
import { BlockNote, Html, Kicker, OptionRow, Stack, Sub, TitleHtml } from "../../../components/ui";
import type { TipoCorte } from "../../../types";

/**
 * Con qué se hace el corte: tijera o máquina.
 *
 * No es una preferencia estética, es una restricción de plantel: solo parte
 * del equipo usa máquina. La respuesta no cambia precio ni duración —cortar
 * con máquina no es un servicio que el salón venda—, cambia A QUIÉN se puede
 * escoger, y eso lo aplica `DatePage` contra `config.profesionalesMaquina`.
 *
 * Va DESPUÉS de adicionales y ANTES de la fecha, y las dos cosas importan.
 * Después de adicionales, porque el corte puede entrar por ahí y no solo
 * dentro del servicio. Antes de la fecha, porque cambiar quién atiende cambia
 * qué horarios existen: preguntarlo luego sería borrarle a la clienta la hora
 * que acababa de elegir.
 *
 * La consecuencia se dice en esta pantalla, al elegir. Sin eso, "con máquina"
 * se traduce dos pantallas más adelante en un calendario casi vacío, y eso no
 * se lee como "hay menos gente que lo hace" sino como que la página falló.
 *
 * No hay opción de "no estoy segura" a propósito: una tercera tarjeta diluye
 * la decisión. En su lugar, la nota empuja hacia máquina, que es el error
 * barato —quien usa máquina también corta con tijera, al revés no—.
 */
export default function CortePage() {
  const navigate = useNavigate();
  const { t, reserva, actualizar } = useApp();
  const s = buscarServicio(reserva.svc);

  const elegir = (c: TipoCorte) => {
    actualizar({ corte: c });
    navigate(PATHS.date);
  };

  return (
    <>
      <Kicker style={{ marginTop: 14 }}>{s?.nombre}</Kicker>
      <TitleHtml html={t("corteTitulo")} />
      <Sub>{t("corteSub")}</Sub>

      <Stack>
        <OptionRow
          title={t("corteTijera")}
          desc={t("corteTijeraH")}
          selectable
          selected={reserva.corte === "tijera"}
          onClick={() => elegir("tijera")}
        />
        <OptionRow
          title={t("corteMaquina")}
          desc={t("corteMaquinaH")}
          selectable
          selected={reserva.corte === "maquina"}
          onClick={() => elegir("maquina")}
        />
      </Stack>

      <BlockNote><Html html={t("corteNota")} /></BlockNote>
    </>
  );
}
