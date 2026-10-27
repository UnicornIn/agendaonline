import { useNavigate } from "react-router-dom";
import { useApp, RESERVA_VACIA } from "../../../context/AppContext";
import { PATHS } from "../../../router/paths";
import { business } from "../../../config/business";
import { Button, ButtonLink, Kicker, Note, Stack, Sub, TitleHtml } from "../../../components/ui";
import { WhatsAppIcon } from "../../../components/ui/Icons";

/**
 * La portada: tres entradas al mismo sitio.
 *
 * La tercera sale de la app: abre el WhatsApp del agente, una persona de
 * verdad. Antes abría un chat simulado dentro de la misma web, y eso promete
 * algo que no existe —la clienta escribe esperando que alguien le conteste—.
 *
 * "Ya soy cliente" es la primera porque es la que ahorra pasos: con el
 * historial no se vuelve a preguntar el diagnóstico ni los datos. "Primera
 * vez" empieza en blanco —sin historial ni diagnóstico heredado— para que una
 * sesión anterior en el mismo navegador no le cuelgue a otra persona el
 * cabello de quien agendó antes.
 */
export default function StartPage() {
  const navigate = useNavigate();
  const { t, actualizar } = useApp();

  const primeraVez = () => {
    actualizar({ ...RESERVA_VACIA, modo: "nueva" });
    navigate(PATHS.menu);
  };

  return (
    <div style={{ paddingTop: 36 }}>
      <Kicker>{t("sede")}</Kicker>
      <TitleHtml html={t("tituloInicio")} />
      <Sub>{t("intro")}</Sub>
      <Stack style={{ marginTop: 26 }}>
        <Button size="big" onClick={() => { actualizar({ modo: "cliente" }); navigate(PATHS.ident); }}>
          {t("btnCliente")}
        </Button>
        <Button size="big" variant="ghost" onClick={primeraVez}>
          {t("btnPrimera")}
        </Button>
        <ButtonLink
          size="big"
          variant="ghost"
          href={`https://wa.me/${business.whatsappAgente}?text=${encodeURIComponent(t("saludoAgente"))}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsAppIcon />{t("btnAgente")}
        </ButtonLink>
      </Stack>
      <Note style={{ marginTop: 20 }}>{t("horario")}</Note>
    </div>
  );
}
