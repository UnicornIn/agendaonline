import { useEffect, useState } from "react";
import { listarSedes } from "../../api/sedes";
import { ApiError } from "../../api/httpClient";
import { config } from "../../config";
import { fijarSede } from "../../data/sede";
import { useApp } from "../../context/AppContext";
import AppRouter from "../../router/AppRouter";
import { Button } from "../../components/ui";

/* =========================================================
   La primera decisión de la visita: en qué sede está

   Antes del 2026-11-19 no había nada que decidir —una sola sede, fija en el
   servidor— y la app arrancaba directo en el router. Ahora el primer segmento
   de la URL es la sede, y eso tiene que resolverse ANTES de montar el router:
   el `basename` se fija al crearlo y de ahí sale que `navigate(PATHS.fecha)`
   lleve a `/sabaneta/fecha` sin que ninguna pantalla sepa en qué sede está.

   Se valida contra `GET /sedes` y no contra una lista escrita acá. Tenerla
   acá sería duplicar la lista blanca del servidor en un sitio que se despliega
   aparte: el día que operación abra una sede, la web diría que no existe hasta
   que alguien recompile.

   Esa lista se usa para TRADUCIR y nunca se pinta. Hubo dos pantallas acá y
   las dos se fueron el mismo día: una que ofrecía las ocho sedes para elegir
   —ofrecer una lista es ofrecer agendar en la equivocada, que es justo lo que
   una URL por sede vino a evitar— y otra que pedía el enlace de la suya, que
   no resolvía nada: dejaba a la clienta sin agendar y sin sede.

   La web tiene UNA pantalla y es la de la sede. Sin apodo en la URL, o con
   uno que no es de nadie, se entra a la primera de la lista. Hoy es
   Suramericana, y eso no está escrito acá: es el orden de
   `AUTOAGENDAMIENTO_SEDES`, o sea una decisión de operación que se cambia sin
   desplegar la web.
   ========================================================= */

/** El prefijo del sitio, si la web no vive en la raíz del dominio. */
const RAIZ = config.router.basename === "/" ? "" : config.router.basename;
const ES_HASH = config.router.mode === "hash";

/**
 * El apodo que viene en la URL, o "" si se entró a la raíz.
 *
 * Con el router en modo hash la ruta vive después del `#`, no en el
 * `pathname`. Son dos despliegues distintos del mismo código —hosting
 * estático contra servidor que reescribe— y leer el lugar equivocado dejaría
 * a uno de los dos sin encontrar nunca la sede.
 */
function apodoDeLaUrl(): string {
  const crudo = ES_HASH
    ? globalThis.location.hash.replace(/^#/, "")
    : globalThis.location.pathname;
  const sinRaiz = !ES_HASH && RAIZ && crudo.startsWith(RAIZ) ? crudo.slice(RAIZ.length) : crudo;
  return (sinRaiz.split("/").filter(Boolean)[0] ?? "").toLowerCase();
}

/**
 * La ruta tal cual, sin el prefijo del sitio: `/entrar`, `/fecha`, "" para la
 * raíz.
 *
 * Se usa cuando el primer segmento NO resultó ser una sede. Entonces no era un
 * apodo: era una ruta del flujo, de cuando la URL no llevaba sede. Se conserva
 * entera y se le antepone la sede predeterminada, así `/entrar` termina en
 * `/suramericana/entrar` y los enlaces viejos siguen sirviendo.
 */
function rutaDelFlujo(): string {
  const crudo = ES_HASH
    ? globalThis.location.hash.replace(/^#/, "")
    : globalThis.location.pathname;
  const sinRaiz = !ES_HASH && RAIZ && crudo.startsWith(RAIZ) ? crudo.slice(RAIZ.length) : crudo;
  const partes = sinRaiz.split("/").filter(Boolean);
  return partes.length ? "/" + partes.join("/") : "";
}

/** A dónde apunta la URL de una sede. Es la URL entera: entrar a una sede es
 *  fijar el `basename` del router, y eso no se puede hacer sin recargar. */
function urlDeSede(slug: string): string {
  return ES_HASH ? `#/${slug}` : `${RAIZ}/${slug}`;
}

type Estado =
  | { fase: "cargando" }
  | { fase: "lista"; slug: string }
  | { fase: "error"; mensaje: string };

export default function Arranque() {
  const { t } = useApp();
  const [estado, setEstado] = useState<Estado>({ fase: "cargando" });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setEstado({ fase: "cargando" });

    listarSedes()
      .then((sedes) => {
        if (!vigente) return;
        if (!sedes.length) {
          // El servidor respondió y no hay ninguna sede abierta. No es una
          // caída y no se dice como una: es una configuración a medias, y
          // "intenta de nuevo" no la va a arreglar.
          setEstado({ fase: "error", mensaje: t("sinSedes") });
          return;
        }

        const apodo = apodoDeLaUrl();
        const encontrada = sedes.find((s) => s.slug === apodo);
        if (encontrada) {
          fijarSede(encontrada);
          setEstado({ fase: "lista", slug: encontrada.slug });
          return;
        }

        // Sin apodo, o con uno que no es de ninguna sede. Se entra a la
        // primera de la lista y se corrige la URL, en vez de mostrar una
        // pantalla a medias: la clienta que teclea el dominio a secas quiere
        // agendar, no leer por qué no puede.
        //
        // Lo que venía después del apodo se conserva: `/entrar` —un enlace de
        // cuando la URL no tenía sede— termina en `/suramericana/entrar` y
        // sigue funcionando. Si eso no es un paso del flujo, el router lo
        // manda a la portada por su propia ruta `*`, que es donde cae
        // cualquier URL inventada.
        const predeterminada = sedes[0];
        const resto = apodo ? rutaDelFlujo() : "";
        globalThis.history.replaceState(
          null,
          "",
          urlDeSede(predeterminada.slug) + resto + globalThis.location.search
        );
        fijarSede(predeterminada);
        setEstado({ fase: "lista", slug: predeterminada.slug });
      })
      .catch((err: unknown) => {
        if (!vigente) return;
        const propio = err instanceof ApiError && err.code && err.code !== "sin_conexion";
        if (!propio) console.error("[sedes] no se pudo cargar la lista:", err);
        setEstado({
          fase: "error",
          mensaje: propio ? (err as ApiError).message : t("errorSedes"),
        });
      });

    return () => {
      vigente = false;
    };
  }, [intento, t]);

  if (estado.fase === "cargando") {
    return <div className="loader">{t("cargandoSedes")}</div>;
  }

  if (estado.fase === "error") {
    return (
      <div className="loader">
        <p style={{ marginBottom: 16 }}>{estado.mensaje}</p>
        <Button onClick={() => setIntento((n) => n + 1)}>{t("reintentar")}</Button>
      </div>
    );
  }

  // El `key` por sede: si alguien llegara a cambiar de sede sin recargar, el
  // router entero se desmonta en vez de quedarse con el basename viejo.
  return <AppRouter key={estado.slug} basename={`${RAIZ}/${estado.slug}`} />;
}
