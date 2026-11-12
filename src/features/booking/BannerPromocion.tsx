import { campana } from "../../data/configAgenda";
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
 */
export default function BannerPromocion() {
  const { lang, reserva, t } = useApp();
  if (!reserva.promocion) return null;

  const { titulo, detalle, porcentaje } = campana();
  // Sin campaña no hay nada que anunciar. Pasa entre el despliegue de la web
  // y el de la agenda, y tambien el dia que la campaña se acabe: el backend
  // deja de mandarla y el banner desaparece solo.
  if (!porcentaje) return null;

  return (
    <div className="promo-banner" role="status">
      <span className="promo-icon" aria-hidden="true">★</span>
      <div>
        <b>{lang === "es" ? titulo : t("promoTitulo")}</b>{" "}
        <span>{lang === "es" ? detalle : t("promoDetalle")}</span>
      </div>
    </div>
  );
}
