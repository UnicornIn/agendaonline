import { business } from "../../config";
import { useApp } from "../../context/AppContext";
import { WhatsAppIcon } from "../ui/Icons";

/**
 * El WhatsApp de dudas, flotando sobre el flujo entero.
 *
 * Acompaña todas las pantallas porque la duda no llega en un paso concreto:
 * llega cuando la clienta está mirando la lista y no sabe si lo suyo es un
 * Full o una definición detallada. Si viviera solo en la portada, para cuando
 * la duda aparece ya quedó atrás.
 *
 * Tres decisiones de ubicación, que son el 90% de que no estorbe:
 *
 * VA DENTRO DEL MARCO, NO DEL NAVEGADOR. `position: absolute` contra
 * `.device`, que es el que tiene `position: relative`. Con `fixed` se anclaría
 * al viewport, y en escritorio —donde la web se ve como un teléfono de 430px
 * centrado— el botón se despegaría hasta la esquina de la pantalla, lejos de
 * la página a la que pertenece.
 *
 * NO EN LA ESQUINA DE ABAJO. Cinco de las pantallas terminan en un botón
 * `Continuar` pegado al fondo y de ancho completo; un flotante en la esquina
 * le taparía el borde derecho a la acción principal. Se levanta lo suficiente
 * para quedar por encima de esa banda, y queda a la misma altura en todas,
 * que es lo que hace que la clienta deje de verlo.
 *
 * Y SE VE A MEDIAS. Atenuado mientras no se usa, entero al apuntarlo o al
 * enfocarlo con el teclado. La idea es que esté cuando se busca y desaparezca
 * cuando no.
 */
export default function AyudaWhatsApp() {
  const { t } = useApp();
  const texto = t("ayudaDudas");

  return (
    <a
      className="ayuda"
      href={`https://wa.me/${business.whatsappDudas}?text=${encodeURIComponent(t("saludoDudas"))}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={texto}
      title={texto}
    >
      <WhatsAppIcon size={21} suelto />
    </a>
  );
}
