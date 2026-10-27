import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { agendaApi } from "../../../api/agenda";
import { ApiError } from "../../../api/httpClient";
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
  const [apartando, setApartando] = useState(false);
  const [errorCupo, setErrorCupo] = useState<string | null>(null);

  const digitos = PAISES[pais][2];
  const nombreOk = isFullName(nombre);
  const telOk = tel.length === digitos;
  const correoOk = isEmail(correo);

  /**
   * Aparta el cupo y pasa al abono.
   *
   * La retención se pide ACÁ y no en el abono: entre que la clienta ve el
   * resumen y termina de pagar pasan varios minutos, y en ese rato el cupo se
   * lo puede llevar otra persona o la recepción de la sede, que no mira esta
   * web. Mejor que falle en este botón, donde todavía puede elegir otra hora,
   * que después de haber transferido.
   */
  async function seguir() {
    setTocado(true);
    if (!nombreOk || !telOk || !correoOk || !reserva.fecha || !reserva.hora) return;

    const datos = {
      nombre: nombre.trim(),
      pais: PAISES[pais][0],
      tel,
      correo: correo.trim().toLowerCase(),
    };

    setApartando(true);
    setErrorCupo(null);
    try {
      const r = await agendaApi.retener(
        reserva.fecha,
        reserva.hora,
        total.servicioIds,
        reserva.estilistaId
      );
      actualizar({
        ...datos,
        retencionId: r.retencionId,
        retencionExpira: r.expiraEn,
        // El servidor pudo elegir por ella si no había preferencia; se guarda
        // a quién le tocó para que el resumen no diga otra cosa.
        estilistaId: r.profesionalId ?? reserva.estilistaId,
        estilista: r.profesionalNombre ?? reserva.estilista,
      });
      navigate(PATHS.deposit);
    } catch (err: unknown) {
      const esCupo = err instanceof ApiError && err.code === "cupo_tomado";
      setErrorCupo(esCupo ? t("cupoTomado") : (err as Error)?.message ?? t("errorCatalogo"));
      // El cupo ya no es suyo: se limpia la hora para que vuelva a elegir en
      // vez de reintentar sobre algo que ya no existe.
      if (esCupo) actualizar({ ...datos, hora: null });
    } finally {
      setApartando(false);
    }
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
          // Sin plasticidad se dice solo la densidad: `null` no es P.B.
          reserva.dens
            ? [t("tuCabello"), reserva.plast ? `${reserva.dens} · ${plastTxt}` : reserva.dens]
            : null,
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

      {errorCupo && (
        <p className="sub" style={{ margin: "12px 0 0" }} role="alert">{errorCupo}</p>
      )}

      <Sticky>
        <Button disabled={apartando} onClick={() => void seguir()}>
          {apartando ? t("apartando") : t("irAbono")}
        </Button>
      </Sticky>
    </>
  );
}
