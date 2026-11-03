import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { track, trackUnaVez } from "../../lib/pixel";
import { disparoDe } from "./embudo";

/**
 * Mide el paso en el que está la clienta. Se usa una vez, en `AppLayout`.
 *
 * El efecto depende SOLO de la ruta. La reserva cambia en cada toque —un
 * adicional que se marca, el día que se elige— y si estuviera en las
 * dependencias el mismo paso mandaría cinco ViewContent. Por eso se lee por
 * referencia: el valor siempre es el último, pero no dispara nada.
 */
export function useMetaPixel(): void {
  const { pathname, state } = useLocation();
  const { reserva } = useApp();

  const ultima = useRef(reserva);
  ultima.current = reserva;

  useEffect(() => {
    track("PageView");

    const citaId = (state as { citaId?: string } | null)?.citaId;
    const disparo = disparoDe(pathname, ultima.current, citaId);
    if (!disparo) return;

    if (disparo.clave) trackUnaVez(disparo.clave, disparo.evento, disparo.datos);
    else track(disparo.evento, disparo.datos);
    // `state` queda fuera a propósito: cambia de identidad en cada navegación y
    // volvería a disparar el paso en el que ya estamos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
}
