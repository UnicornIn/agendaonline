import { useEffect, useState } from "react";
import { agendaApi } from "../../api/agenda";
import { ApiError } from "../../api/httpClient";
import { cargarCatalogo } from "../../data/catalog";
import { cargarConfigAgenda } from "../../data/configAgenda";
import { construirCatalogo } from "../../data/adaptador";
import { useApp } from "../../context/AppContext";
import { Button } from "../../components/ui";

/**
 * Trae el catálogo de la agenda antes de dejar entrar al flujo.
 *
 * Es una puerta y no un "mientras tanto": sin catálogo no hay precios, no hay
 * duraciones y no hay `servicio_id`, así que una pantalla pintada antes de que
 * llegue mostraría un menú vacío y la clienta pensaría que la sede no tiene
 * servicios. Es más honesto un "cargando" de medio segundo.
 *
 * Se pide UNA vez por sesión. El catálogo de una sede no cambia mientras
 * alguien agenda, y volver a pedirlo en cada pantalla son diez llamadas para
 * la misma respuesta.
 *
 * `GET /config` entra por la misma puerta y es igual de obligatorio: de ahí
 * sale cuánto hay que abonar. No se le pone un valor por defecto porque un
 * abono inventado se ve igual de bien que el real y la clienta transfiere esa
 * cifra. Los dos salen del mismo backend, así que exigir los dos no agrega un
 * modo de falla: si uno no responde, el otro tampoco.
 */

type Estado = { fase: "cargando" } | { fase: "listo" } | { fase: "error"; mensaje: string };

export default function CargaCatalogo({ children }: { children: React.ReactNode }) {
  const { t } = useApp();
  const [estado, setEstado] = useState<Estado>({ fase: "cargando" });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setEstado({ fase: "cargando" });
    Promise.all([agendaApi.catalogo(), agendaApi.config()])
      .then(([servicios, config]) => {
        if (!vigente) return;
        cargarConfigAgenda(config);
        const catalogo = construirCatalogo(servicios);
        if (!catalogo.length) {
          // El backend respondió, pero nada de lo que mandó se puede mostrar.
          // Es distinto de una caída y se dice distinto.
          setEstado({ fase: "error", mensaje: t("sinServicios") });
          return;
        }
        cargarCatalogo(catalogo);
        setEstado({ fase: "listo" });
      })
      .catch((err: unknown) => {
        if (!vigente) return;
        // El mensaje del backend solo se muestra cuando ÉL lo redactó para la
        // clienta —los errores del módulo traen `error.codigo`—. Lo demás es
        // "Error 500", un timeout del proxy o lo que diga un gateway, y nada
        // de eso le dice a nadie qué hacer. Queda en consola para quien
        // depure y en pantalla va algo que sí se entiende.
        const propio = err instanceof ApiError && err.code && err.code !== "sin_conexion";
        if (!propio) console.error("[catálogo] no se pudo cargar:", err);
        setEstado({
          fase: "error",
          mensaje: propio ? (err as ApiError).message : t("errorCatalogo"),
        });
      });
    return () => {
      vigente = false;
    };
  }, [intento, t]);

  if (estado.fase === "cargando") {
    return <div className="loader">{t("cargandoServicios")}</div>;
  }

  if (estado.fase === "error") {
    return (
      <div className="loader">
        <p style={{ marginBottom: 16 }}>{estado.mensaje}</p>
        <Button onClick={() => setIntento((n) => n + 1)}>{t("reintentar")}</Button>
      </div>
    );
  }

  return <>{children}</>;
}
