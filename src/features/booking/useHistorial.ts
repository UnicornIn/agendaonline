import { useCallback, useEffect, useMemo, useState } from "react";
import type { Historial } from "../../types";

/* =========================================================
   El historial de la clienta reconocida

   Vive en `sessionStorage` y no en `localStorage` a propósito: es información
   sobre el cabello de una persona, y un celular prestado o un computador
   compartido no tienen por qué guardarla hasta la próxima visita. Al cerrar la
   pestaña se va, y la clienta vuelve a entrar con su celular, que toma dos
   toques.
   ========================================================= */

const CLAVE = "rf_historial";

function cargar(): Historial | null {
  try {
    const raw = sessionStorage.getItem(CLAVE);
    return raw ? (JSON.parse(raw) as Historial) : null;
  } catch {
    return null;
  }
}

/** Fuera del hook para que todas las pantallas vean el mismo valor al instante */
const oyentes = new Set<(h: Historial | null) => void>();
let actual: Historial | null = cargar();

function publicar(h: Historial | null) {
  actual = h;
  try {
    if (h) sessionStorage.setItem(CLAVE, JSON.stringify(h));
    else sessionStorage.removeItem(CLAVE);
  } catch {
    /* sin almacenamiento: vale mientras la app esté abierta */
  }
  oyentes.forEach((f) => f(h));
}

export function useHistorial() {
  const [historial, setHistorial] = useState<Historial | null>(actual);

  useEffect(() => {
    oyentes.add(setHistorial);
    return () => {
      oyentes.delete(setHistorial);
    };
  }, []);

  const guardar = useCallback((h: Historial) => publicar(h), []);
  const olvidar = useCallback(() => publicar(null), []);

  return useMemo(() => ({ historial, guardar, olvidar }), [historial, guardar, olvidar]);
}
