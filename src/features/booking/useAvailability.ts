import { useEffect, useState } from "react";
import { availabilityApi } from "../../api";
import type { AvailabilitySlot } from "../../types";

interface AvailabilityState {
  slots: AvailabilitySlot[];
  loading: boolean;
  error: unknown;
}

/** Horarios de un día para un bloque de `duration` minutos */
export function useAvailability(date: string | null, duration: number): AvailabilityState {
  const [state, setState] = useState<AvailabilityState>({ slots: [], loading: true, error: null });

  useEffect(() => {
    if (!date) return;
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    availabilityApi
      .byDate({ date, duration }, { signal: ctrl.signal })
      .then((slots) => {
        if (!ctrl.signal.aborted) setState({ slots, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!ctrl.signal.aborted) setState({ slots: [], loading: false, error });
      });
    return () => ctrl.abort();
  }, [date, duration]);

  return state;
}
