import { useEffect, useState } from "react";
import { listarSedes } from "../../api/sedes";
import { ApiError } from "../../api/httpClient";
import { config } from "../../config";
import { fijarSede } from "../../data/sede";
import { useApp } from "../../context/AppContext";
import AppRouter from "../../router/AppRouter";
import SedesPage from "./pages/SedesPage";
import { Button } from "../../components/ui";
import type { SedePublica } from "../../types";

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

/** A dónde apunta el enlace de una sede. Es la URL entera: cambiar de sede es
 *  cambiar de `basename`, y eso no se puede hacer sin recargar. */
export function urlDeSede(slug: string): string {
  return ES_HASH ? `#/${slug}` : `${RAIZ}/${slug}`;
}

type Estado =
  | { fase: "cargando" }
  | { fase: "lista"; slug: string }
  | { fase: "elegir"; sedes: SedePublica[]; desconocida: string | null }
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

        // Una sola sede abierta: no hay nada que preguntar. Es el caso del
        // despliegue de siempre, el de Suramericana sola, y así entrar a la
        // raíz sigue llevando directo al flujo como llevaba ayer.
        if (!apodo && sedes.length === 1) {
          const sola = sedes[0];
          globalThis.history.replaceState(
            null,
            "",
            urlDeSede(sola.slug) + globalThis.location.search
          );
          fijarSede(sola);
          setEstado({ fase: "lista", slug: sola.slug });
          return;
        }

        // O entró a la raíz con varias sedes abiertas, o el apodo de la URL
        // no es ninguna. Las dos terminan en la misma pantalla; la segunda
        // además dice qué pasó, porque suele ser un enlace viejo.
        setEstado({ fase: "elegir", sedes, desconocida: apodo || null });
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

  if (estado.fase === "elegir") {
    return <SedesPage sedes={estado.sedes} desconocida={estado.desconocida} />;
  }

  // El `key` por sede: si alguien llegara a cambiar de sede sin recargar, el
  // router entero se desmonta en vez de quedarse con el basename viejo.
  return <AppRouter key={estado.slug} basename={`${RAIZ}/${estado.slug}`} />;
}
