import { campana, hayCampana } from "../../data/configAgenda";
import { useApp } from "../../context/AppContext";

/**
 * El beneficio de la campaña de reactivación, visible en todo el flujo.
 *
 * Va en el marco y no en una pantalla porque la clienta tiene que verlo desde
 * que se identifica hasta que abona: si solo estuviera en el menú, se le
 * olvidaría justo donde decide el precio.
 *
 * Aparece SOLO si el backend dijo que a este teléfono le toca
 * (`reserva.promocion`, que sale de `POST /clienta/historial`). Nunca se
 * deduce acá: anunciar un descuento que el servidor no va a aplicar es
 * prometerle plata a alguien que no la tiene.
 *
 * El título y el detalle vienen del backend, con las mismas palabras que
 * acompañan la regla que él aplica al cobrar. En inglés se traducen acá
 * porque el backend solo los manda en español.
 *
 * Vive DENTRO de la sección que scrollea, así que se va con el contenido al
 * bajar y vuelve al subir. Ver el comentario en `AppLayout`.
 */
export default function BannerPromocion() {
  const { lang, reserva, t } = useApp();
  if (!reserva.promocion) return null;

  // Sin campaña en ESTA sede no hay nada que anunciar: el backend deja de
  // mandarla y el banner desaparece solo. Ver `hayCampana`.
  if (!hayCampana()) return null;

  const { titulo, detalle } = campana();

  return (
    <div className="promo" role="status">
      <span className="pin" aria-hidden="true">★</span>
      <div>
        {/* El titulo en su propia linea. Pegado al detalle se leia como una
            sola frase sin verbo: "Tienes un beneficio especial 20% de
            descuento en todos nuestros servicios." */}
        <b>{lang === "es" ? titulo : t("promoTitulo")}</b>
        <span>{lang === "es" ? detalle : t("promoDetalle")}</span>
      </div>
    </div>
  );
}
