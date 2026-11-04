import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Un PageView por paso del flujo. Se usa una vez, en `AppLayout`.
 *
 * La primera pantalla NO se cuenta acá: ya la mandó el snippet de
 * `index.html` junto con el `init`. Si además la mandara este efecto, toda
 * visita empezaría con dos PageView y la portada parecería el doble de
 * visitada de lo que es.
 *
 * Lo que se recuerda es la ÚLTIMA ruta contada, no cuántas veces corrió el
 * efecto. La diferencia importa: `StrictMode` monta dos veces en desarrollo, y
 * una guarda de "sáltate la primera vez" deja pasar la segunda —que es el
 * mismo paso—. Comparando rutas, el mismo paso nunca cuenta dos veces, lo
 * monte React las veces que lo monte.
 *
 * Vive fuera del componente a propósito: un `useRef` nace de nuevo con cada
 * montaje, y entonces no habría nada que recordar.
 */
const contada: { ruta: string | null } = { ruta: null };

export function useMetaPixel(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    // La primera de la visita: su PageView ya salió desde el HTML.
    if (contada.ruta === null) {
      contada.ruta = pathname;
      return;
    }
    if (contada.ruta === pathname) return;
    contada.ruta = pathname;

    try {
      window.fbq?.("track", "PageView");
    } catch {
      /* el píxel nunca rompe la navegación */
    }
  }, [pathname]);
}
