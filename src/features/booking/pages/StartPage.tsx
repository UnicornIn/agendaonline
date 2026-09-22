import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { business } from "../../../config";
import { useBooking } from "../../../context/BookingContext";
import { PATHS } from "../../../router/paths";
import { Button, Kicker, Note, Stack, Sub, Title } from "../../../components/ui";

/** `state` que otras pantallas pueden mandar al navegar a la portada */
export interface StartPageState {
  /** Limpia la reserva en curso (p. ej. "Agendar otra cita") */
  resetBooking?: boolean;
}

export default function StartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { reset } = useBooking();
  const resetBooking = (location.state as StartPageState | null)?.resetBooking;

  useEffect(() => {
    if (resetBooking) reset();
  }, [resetBooking, reset]);

  const waHref = `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(
    `Hola, quiero agendar una cita en la sede ${business.branch.name}.`
  )}`;

  return (
    <div style={{ paddingTop: 42 }}>
      <Kicker>Sede {business.branch.name} · {business.branch.city}</Kicker>
      <Title>Agenda tu cita<br />en {business.brand}</Title>
      <Sub>Elige cómo prefieres hacerlo. Las dos rutas llegan al mismo lugar: tu cita confirmada en Agenda RF.</Sub>
      <Stack style={{ marginTop: 34 }}>
        <Button size="big" onClick={() => navigate(PATHS.menu)}>Agendarme solo</Button>
        {/* El agente atiende por WhatsApp */}
        <a className="btn big ghost wa" href={waHref} target="_blank" rel="noopener noreferrer">
          Hablar con el agente
        </a>
      </Stack>
      <Note style={{ marginTop: 26 }}>{business.hoursText}</Note>
    </div>
  );
}
