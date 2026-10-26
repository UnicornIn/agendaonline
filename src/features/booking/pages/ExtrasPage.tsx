import { useNavigate } from "react-router-dom";
import { adicionalesDe, buscarServicio } from "../../../data/catalog";
import { useApp } from "../../../context/AppContext";
import { PATHS } from "../../../router/paths";
import { calcularTotal } from "../../../lib/pricing";
import { Button, Kicker, OptionRow, Stack, Sticky, Sub, TitleHtml } from "../../../components/ui";

/**
 * Los adicionales del servicio elegido.
 *
 * El botón muestra el total y el bloque actualizados a medida que se marcan:
 * son dos números que cambian juntos —se paga más y se reserva más tiempo— y
 * verlos antes de seguir evita la sorpresa en la confirmación.
 */
export default function ExtrasPage() {
  const navigate = useNavigate();
  const { t, reserva, actualizar } = useApp();
  const s = buscarServicio(reserva.svc)!;
  const total = calcularTotal(reserva);

  const alternar = (nombre: string) =>
    actualizar((r) => ({
      extras: r.extras.includes(nombre) ? r.extras.filter((x) => x !== nombre) : [...r.extras, nombre],
    }));

  return (
    <>
      <Kicker style={{ marginTop: 14 }}>{s.nombre}</Kicker>
      <TitleHtml html={t("extrasTitulo")} />
      <Sub>{t("extrasSub")}</Sub>

      <Stack>
        {adicionalesDe(s).map((a) => (
          <OptionRow
            key={a.n}
            title={a.n}
            desc={a.t}
            price={a.p}
            selectable
            selected={reserva.extras.includes(a.n)}
            onClick={() => alternar(a.n)}
          />
        ))}
      </Stack>

      <Sticky>
        <Button onClick={() => navigate(PATHS.date)}>
          {reserva.extras.length
            ? `${t("continuar")} · ${total.precio}${total.tiempo ? ` · ${total.tiempo}` : ""}`
            : t("sinAgregar")}
        </Button>
      </Sticky>
    </>
  );
}
