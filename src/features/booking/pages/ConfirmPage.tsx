import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PAISES } from "../../../data/catalog";
import { useApp } from "../../../context/AppContext";
import { PATHS } from "../../../router/paths";
import { calcularTotal } from "../../../lib/pricing";
import { fechaISOBonita } from "../../../lib/dates";
import { isEmail, isFullName } from "../../../lib/validation";
import {
  Button, Callout, Field, PhoneField, Sticky, Sub, SummaryTable, Title,
} from "../../../components/ui";

/**
 * El resumen y los datos de contacto.
 *
 * El correo va acá y no es opcional: es a donde la agenda manda la
 * confirmación de la cita y la asesoría del Servicio Full. Quien entró con su
 * correo o con su historial lo encuentra ya lleno; solo lo teclea quien llegó
 * por "primera vez", que es justamente de quien no tenemos nada.
 */
export default function ConfirmPage() {
  const navigate = useNavigate();
  const { t, lang, reserva, actualizar } = useApp();
  const total = calcularTotal(reserva);

  const [nombre, setNombre] = useState(reserva.nombre);
  const [pais, setPais] = useState(() => Math.max(0, PAISES.findIndex(([c]) => c === reserva.pais)));
  const [tel, setTel] = useState(reserva.tel);
  const [correo, setCorreo] = useState(reserva.correo);
  const [tocado, setTocado] = useState(false);

  const digitos = PAISES[pais][2];
  const nombreOk = isFullName(nombre);
  const telOk = tel.length === digitos;
  const correoOk = isEmail(correo);

  function seguir() {
    setTocado(true);
    if (!nombreOk || !telOk || !correoOk) return;
    actualizar({
      nombre: nombre.trim(),
      pais: PAISES[pais][0],
      tel,
      correo: correo.trim().toLowerCase(),
    });
    navigate(PATHS.deposit);
  }

  const plastTxt = reserva.plast === "pa" ? t("soloSe").toLowerCase() : t("ayuda").toLowerCase();

  return (
    <>
      <Title style={{ marginTop: 14 }}>{t("confTitulo")}</Title>
      <Sub>{t("confSub")}</Sub>

      <SummaryTable
        rows={[
          [reserva.extras.length ? t("servicios") : t("servicio"), total.labels.join(" + ")],
          [t("valor"), total.precio],
          total.tiempo ? [t("bloque"), total.tiempo] : null,
          [t("cuando"), `${fechaISOBonita(reserva.fecha, lang)} · ${reserva.hora}`],
          [t("con"), reserva.estilista ?? t("primeraDisp")],
          reserva.dens ? [t("tuCabello"), `${reserva.dens} · ${plastTxt}`] : null,
        ]}
      />

      <Field
        id="i-nom" label={t("nombreCompleto")} autoComplete="name"
        value={nombre} onChange={(e) => setNombre(e.target.value)}
        invalid={tocado && !nombreOk} error={t("errNombre")}
      />
      <PhoneField
        id="i-cel" label={t("celular")} inputMode="numeric" autoComplete="tel"
        value={tel} onChange={(e) => setTel(e.target.value.replace(/\D/g, "").slice(0, 15))}
        invalid={tocado && !telOk} error={t("errTel", { "%n": digitos })}
        selectProps={{
          options: PAISES,
          value: pais,
          "aria-label": t("celular"),
          onChange: (e) => setPais(Number(e.target.value)),
        }}
      />
      <Field
        id="i-mail2" label={t("correo")} type="email" inputMode="email" autoComplete="email"
        placeholder="tucorreo@mail.com"
        value={correo} onChange={(e) => setCorreo(e.target.value)}
        invalid={tocado && !correoOk} error={t("errMail")}
      />

      <Callout>{t("reprogramar")}</Callout>

      <Sticky>
        <Button onClick={seguir}>{t("irAbono")}</Button>
      </Sticky>
    </>
  );
}
