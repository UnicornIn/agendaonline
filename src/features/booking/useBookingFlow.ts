import { useNavigate } from "react-router-dom";
import { useCatalog } from "../../context/CatalogContext";
import { useBooking } from "../../context/BookingContext";
import { PATHS } from "../../router/paths";
import { fullOptionFor, optionsFor } from "../../lib/pricing";
import type { Booking, Density, ServiceKey, ServiceOption } from "../../types";

/** Reglas de navegación entre pasos del autoagendamiento */
export function useBookingFlow() {
  const catalog = useCatalog();
  const { booking, update, reset } = useBooking();
  const navigate = useNavigate();

  // Con el diagnóstico listo: si hay varias opciones se eligen, si hay una va directo al detalle
  function routeToService(next: Booking & { svc: ServiceKey }) {
    const list = optionsFor(catalog, next.svc, next.easy);
    if (list.length > 1) {
      update(next);
      navigate(PATHS.options);
    } else {
      update({ ...next, opt: list[0] });
      navigate(PATHS.detail);
    }
  }

  function chooseService(svc: ServiceKey) {
    const next = { ...booking, svc, easy: null, dens: null, opt: null, extras: [] };
    if (catalog.services[svc].diag) {
      update(next);
      navigate(PATHS.density);
    } else {
      routeToService(next);
    }
  }

  function setDensity(dens: Density) {
    if (!booking.svc) return;
    const next = { ...booking, svc: booking.svc, dens };
    if (catalog.services[booking.svc].diag === "full") {
      update(next);
      navigate(PATHS.plasticity);
    } else {
      routeToService(next);
    }
  }

  function setPlasticity(easy: boolean) {
    if (booking.svc) routeToService({ ...booking, svc: booking.svc, easy });
  }

  function chooseOption(opt: ServiceOption) {
    update({ opt });
    navigate(PATHS.detail);
  }

  function switchToFull() {
    if (booking.easy === null) {
      update({ svc: "full", extras: [] });
      navigate(PATHS.density);
    } else {
      update({ svc: "full", extras: [], opt: fullOptionFor(catalog, booking.easy) });
      navigate(PATHS.detail);
    }
  }

  return { catalog, booking, update, reset, navigate, chooseService, setDensity, setPlasticity, chooseOption, switchToFull };
}
