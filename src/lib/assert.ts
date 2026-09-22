import type { WithRequired } from "../types";

/** Devuelve el valor o lanza si es null/undefined */
export function must<T>(value: T | null | undefined, message: string): T {
  if (value == null) throw new Error(message);
  return value;
}

/**
 * Estrecha el tipo de un objeto garantizando que ciertos campos no son nulos.
 * Las páginas protegidas por <RequireBooking> lo usan para trabajar sin `!`.
 */
export function requireFields<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): WithRequired<T, K> {
  for (const k of keys) {
    if (obj[k] == null) throw new Error(`Falta el campo "${String(k)}"`);
  }
  return obj as WithRequired<T, K>;
}
