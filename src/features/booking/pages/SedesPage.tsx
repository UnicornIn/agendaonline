import { business } from "../../../config";
import { useApp } from "../../../context/AppContext";
import { urlDeSede } from "../Arranque";
import { ButtonLink, Kicker, Note, Stack, Sub, TitleHtml } from "../../../components/ui";
import type { SedePublica } from "../../../types";

/**
 * En qué sede quiere agendar, para quien llegó sin sede.
 *
 * Es la raíz del sitio y el paso que nadie debería ver: el enlace que se
 * reparte por WhatsApp y el que va en la pauta llevan directo a la sede
 * —`citas.rizosfelices.co/sabaneta`— y se entra al flujo sin elegir nada.
 * Esta pantalla es para los otros dos casos: quien teclea el dominio a secas
 * y quien llega con un enlace viejo, de cuando la URL no tenía sede.
 *
 * Vive FUERA del router, y por eso los enlaces son `<a>` y no `<Link>`.
 * Elegir sede es cambiar el `basename` del router, y eso no se puede hacer en
 * caliente: la navegación tiene que ser una carga de página de verdad.
 *
 * El marco (`stage`/`device`) se repite acá en vez de reusar `AppLayout`
 * porque ese trae lo que esta pantalla no tiene todavía: la barra de
 * progreso de un flujo que no empezó, el botón de atrás a ninguna parte y
 * —sobre todo— la puerta que pide el catálogo de una sede que aún no se
 * eligió.
 */
export default function SedesPage({
  sedes,
  desconocida,
}: {
  sedes: SedePublica[];
  desconocida: string | null;
}) {
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
              <Kicker>{t("elegirSedeKicker")}</Kicker>
              <TitleHtml html={t("elegirSedeTitulo")} />
              <Sub>{t("elegirSedeSub")}</Sub>

              {/* Solo cuando el apodo venía escrito y no existe. Entrar a la
                  raíz no es un error y no se trata como uno. */}
              {desconocida && <Note style={{ marginTop: 14 }}>{t("sedeDesconocida")}</Note>}

              <Stack style={{ marginTop: 26 }}>
                {sedes.map((sede) => (
                  <ButtonLink key={sede.slug} size="big" variant="ghost" href={urlDeSede(sede.slug)}>
                    {sede.ciudad ? `${sede.nombre} · ${sede.ciudad}` : sede.nombre}
                  </ButtonLink>
                ))}
              </Stack>

              <Note style={{ marginTop: 20 }}>{t("horario")}</Note>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
