import { http } from "./httpClient";
import { ENDPOINTS } from "../config/endpoints";
import type { SedePublica } from "../types";

/* =========================================================
   Qué sedes agendan por internet

   Es la única llamada del módulo que NO cuelga de una sede, por razones
   obvias: es la lista de sedes. Se pide una vez al arrancar y decide dos
   cosas a la vez — si el apodo de la URL existe, y qué se le ofrece a quien
   llegue a la raíz del sitio sin apodo.

   El backend no devuelve el `sede_id` de nadie. Lo que viaja es el apodo, que
   es lo que ya está en la URL.
   ========================================================= */

export function listarSedes(): Promise<SedePublica[]> {
  return http
    .get<{ sedes: SedePublica[] }>(ENDPOINTS.sedes)
    .then((r) => r.sedes ?? []);
}
