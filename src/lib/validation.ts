export const onlyDigits = (v: string, max = 10): string => v.replace(/\D/g, "").slice(0, max);
export const isFullName = (v: string): boolean => v.trim().split(/\s+/).filter(Boolean).length >= 2;
export const isPhone = (v: string): boolean => /^\d{10}$/.test(v);
