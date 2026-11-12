import { descuento, money } from "../../lib/pricing";
import type { Reserva } from "../../types";

/**
 * El valor del bloque: con el de lista tachado al lado cuando hay descuento.
 *
 * Una sola pieza para las tres pantallas que muestran el valor —resumen,
 * abono y confirmación— porque es la misma cifra y tiene que leerse igual en
 * las tres. Teniéndolo escrito tres veces, la primera que alguien olvide
 * actualizar le promete a la clienta un precio que no es.
 *
 * Sin descuento devuelve la cifra pelada, así que se puede usar siempre y no
 * hay que preguntar antes.
 */
export default function ValorConDescuento({
  reserva,
  precioDeLista,
}: {
  reserva: Pick<Reserva, "svc" | "dens" | "plast" | "extras" | "promocion" | "fecha">;
  /** Lo que diría la fila sin campaña. Puede ser un rango ("$121.000 -
   *  $210.000"), y por eso llega como texto ya formateado y no como número. */
  precioDeLista: string;
}) {
  const { aplica, total } = descuento(reserva);
  if (!aplica || total == null) return <>{precioDeLista}</>;

  return (
    <>
      {/* <s> y no un span con line-through: para quien lee con lector de
          pantalla, "s" dice que ese precio ya no rige. Visualmente es gris y
          más chico, así que el ojo cae primero en el que va a pagar. */}
      <s className="antes">{precioDeLista}</s> {money(total)}
    </>
  );
}
