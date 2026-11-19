import { business } from "../../../config";
import { useApp } from "../../../context/AppContext";
import { ButtonLink, Kicker, Note, Stack, Sub, TitleHtml } from "../../../components/ui";
import { WhatsAppIcon } from "../../../components/ui/Icons";

/**
 * Llegó sin sede. No se le ofrece ninguna: se le manda a pedir su enlace.
 *
 * Acá hubo una lista para elegir y se quitó el 2026-11-19, el mismo día que
 * se escribió. La razón es la que motivó que cada sede tuviera su URL desde
 * el principio: **una lista de sedes es una invitación a escoger mal.** La
 * clienta que no está segura toca la primera, o la que le suena, y la cita
 * queda en otra ciudad. Eso no se descubre acá — se descubre el día de la
 * cita, con la clienta parada en el salón equivocado y una hora de estilista
 * perdida en el otro.
 *
 * Nadie debería ver esta pantalla. El enlace que se reparte por WhatsApp y el
 * que va en la pauta llevan directo a la sede. Esto es para quien teclea el
 * dominio a secas y para quien llega con un enlace viejo, de cuando la URL no
 * tenía sede, y lo único honesto que se le puede ofrecer es a alguien que sí
 * sabe en qué sede atiende.
 *
 * Vive FUERA del router —no hay sede, así que no hay `basename`— y por eso el
 * marco (`stage`/`device`) se repite acá en vez de reusar `AppLayout`.
 */
export default function SinSedePage({ desconocida }: { desconocida: string | null }) {
  const { lang, cambiarIdioma, t } = useApp();

  return (
    <div className="stage">
      <div className="protolabel">{business.brand}</div>
      <div className="device">
        <header className="nav">
          <span className="back" aria-hidden="true" />
          <div className="navtitle">{business.brand}</div>
          <button
            className="lang"
            onClick={cambiarIdioma}
            aria-label={lang === "es" ? "Switch to English" : "Cambiar a español"}
          >
            {lang === "es" ? "EN" : "ES"}
          </button>
        </header>
        <main className="screens">
          <section className="screen active">
            <div style={{ paddingTop: 36 }}>
              <Kicker>{business.brand}</Kicker>
              <TitleHtml html={t("sinSedeTitulo")} />
              <Sub>{t("sinSedeSub")}</Sub>

              {/* Solo cuando el apodo venía escrito y no es de nadie. Entrar
                  al dominio a secas no es un error y no se trata como uno. */}
              {desconocida && <Note style={{ marginTop: 14 }}>{t("sedeDesconocida")}</Note>}

              <Stack style={{ marginTop: 26 }}>
                <ButtonLink
                  size="big"
                  href={`https://wa.me/${business.whatsappDudas}?text=${encodeURIComponent(
                    t("saludoSinSede")
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon />
                  {t("pedirEnlace")}
                </ButtonLink>
              </Stack>

              <Note style={{ marginTop: 20 }}>{t("horario")}</Note>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
