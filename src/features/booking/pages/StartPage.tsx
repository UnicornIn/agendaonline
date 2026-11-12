import { useNavigate } from "react-router-dom";
import { useApp, RESERVA_VACIA } from "../../../context/AppContext";
import { PATHS } from "../../../router/paths";
import { business } from "../../../config/business";
import { Button, ButtonLink, Kicker, Note, Stack, Sub, TitleHtml } from "../../../components/ui";
import { WhatsAppIcon } from "../../../components/ui/Icons";

/**
 * La portada: dos entradas al mismo sitio, y una tercera oculta.
 *
 * La tercera sale de la app: abre el WhatsApp del agente, una persona de
 * verdad. Antes abría un chat simulado dentro de la misma web, y eso promete
 * algo que no existe —la clienta escribe esperando que alguien le conteste—.
 * Está apagada desde el 2026-11-12; ver `MOSTRAR_AGENTE`.
 *
 * "Ya soy cliente" es la primera porque es la que ahorra pasos: con el
 * historial no se vuelve a preguntar el diagnóstico ni los datos. "Primera
 * vez" empieza en blanco —sin historial ni diagnóstico heredado— para que una
 * sesión anterior en el mismo navegador no le cuelgue a otra persona el
 * cabello de quien agendó antes.
 */
/**
 * Si la portada ofrece el botón del agente.
 *
 * Apagado el 2026-11-12 por decisión de operación. Queda acá y no en una
 * variable de entorno a propósito: prenderlo de vuelta es cambiar este `false`
 * y desplegar, sin tocar la configuración del servidor.
 */
const MOSTRAR_AGENTE = false;

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
        {MOSTRAR_AGENTE && (
          <ButtonLink
            size="big"
            variant="ghost"
            href={`https://wa.me/${business.whatsappAgente}?text=${encodeURIComponent(t("saludoAgente"))}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon />{t("btnAgente")}
          </ButtonLink>
        )}
      </Stack>
      <Note style={{ marginTop: 20 }}>{t("horario")}</Note>
    </div>
  );
}
