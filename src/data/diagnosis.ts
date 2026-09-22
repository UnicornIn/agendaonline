import type { DensityOption, PlasticityOption } from "../types";

/* Opciones visuales del diagnóstico. Pon la URL del video en `video` cuando exista. */
export const DENSITY_OPTIONS: DensityOption[] = [
  { value: "Baja", hint: "Se ve el cuero cabelludo con facilidad", video: null },
  { value: "Media", hint: "Se ve solo si abres el cabello", video: null },
  { value: "Alta", hint: "Casi no se ve el cuero cabelludo", video: null },
  { value: "Extra alta", hint: "Volumen muy abundante, la mano no lo abarca", video: null },
];

export const PLASTICITY_OPTIONS: PlasticityOption[] = [
  { value: true, name: "Se forma solo", hint: "Pasas el cepillo y el rizo aparece", video: null },
  { value: false, name: "Necesita ayuda", hint: "Hay que formarlo mechón por mechón", video: null },
];
