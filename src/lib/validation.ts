export const onlyDigits = (v: string, max = 10): string => v.replace(/\D/g, "").slice(0, max);
export const isFullName = (v: string): boolean => v.trim().split(/\s+/).filter(Boolean).length >= 2;
export const isPhone = (v: string): boolean => /^\d{10}$/.test(v);

/**
 * Una validación a propósito laxa: algo, arroba, algo, punto, algo.
 *
 * Lo estricto se valida solo cuando el correo llega o no llega. Una expresión
 * que persiga el RFC rechaza direcciones válidas y deja a la clienta sin poder
 * agendar por un dominio raro, que es un costo mucho más alto que aceptar un
 * correo con un dedazo.
 */
export const isEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
