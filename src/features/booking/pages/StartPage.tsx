import { useNavigate } from "react-router-dom";
import { useApp, RESERVA_VACIA } from "../../../context/AppContext";
import { PATHS } from "../../../router/paths";
import { Button, Kicker, Note, Stack, Sub, TitleHtml } from "../../../components/ui";
import { WhatsAppIcon } from "../../../components/ui/Icons";

/**
 * La portada: tres entradas al mismo sitio.
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
        <Button size="big" variant="ghost" onClick={() => { actualizar({ modo: "agente" }); navigate(PATHS.chat); }}>
          <WhatsAppIcon />{t("btnAgente")}
        </Button>
      </Stack>
      <Note style={{ marginTop: 20 }}>{t("horario")}</Note>
    </div>
  );
}
