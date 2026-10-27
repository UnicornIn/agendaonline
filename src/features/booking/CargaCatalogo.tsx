import { useEffect, useState } from "react";
import { agendaApi } from "../../api/agenda";
import { ApiError } from "../../api/httpClient";
import { cargarCatalogo } from "../../data/catalog";
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
 */

type Estado = { fase: "cargando" } | { fase: "listo" } | { fase: "error"; mensaje: string };

export default function CargaCatalogo({ children }: { children: React.ReactNode }) {
  const { t } = useApp();
  const [estado, setEstado] = useState<Estado>({ fase: "cargando" });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setEstado({ fase: "cargando" });
    agendaApi
      .catalogo()
      .then((servicios) => {
        if (!vigente) return;
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
        const mensaje = err instanceof ApiError ? err.message : t("errorCatalogo");
        setEstado({ fase: "error", mensaje });
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
