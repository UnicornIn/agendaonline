import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buscarHistorial } from "../../../api/clientes";
import { PAISES } from "../../../data/catalog";
import { useApp } from "../../../context/AppContext";
import { useToast } from "../../../context/ToastContext";
import { useHistorial } from "../useHistorial";
import { PATHS } from "../../../router/paths";
import { isEmail, isFullName } from "../../../lib/validation";
import { Button, Field, Html, PhoneField, Segmented, Sticky, Sub, TitleHtml } from "../../../components/ui";

/** Con qué datos probar sin backend. Se borra del build de producción. */
const AYUDA_PROTOTIPO =
  "En el prototipo prueba con <b>Laura Restrepo</b> y <b>310 456 7890</b>.";

/**
 * El nombre, y después el celular O el correo.
 *
 * El nombre es obligatorio y el contacto es uno de los dos. Son dos reglas
 * distintas y conviene no confundirlas:
 *
 * El nombre está porque el backend no entrega un historial a cambio de un
 * contacto suelto: eso sería un oráculo para averiguar, probando datos, quién
 * es clienta de Rizos y qué se hace en el pelo. Que el nombre concuerde con
 * el guardado es lo que lo cierra.
 *
 * El contacto es uno u otro porque la sede registró a unas clientas con
 * teléfono y a otras con correo. Exigir los dos deja afuera justo a las de
 * siempre, que son las que este atajo busca.
 *
 * No encontrar historial NO es un error: se avisa y se sigue al menú como
 * primera vez. Dejar a alguien atrapado en una pantalla de login porque la
 * sede nunca la registró —o porque escribió su nombre distinto— sería perder
 * la cita.
 */
export default function IdentPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t, reserva, actualizar } = useApp();
  const { guardar } = useHistorial();

  const [nombre, setNombre] = useState(reserva.nombre);
  const [via, setVia] = useState(reserva.via);
  const [pais, setPais] = useState(() => Math.max(0, PAISES.findIndex(([c]) => c === reserva.pais)));
  const [tel, setTel] = useState(reserva.tel);
  const [correo, setCorreo] = useState(reserva.correo);
  const [tocado, setTocado] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const primerCampo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setTimeout(() => primerCampo.current?.focus(), 250);
    return () => clearTimeout(id);
  }, []);

  const porTelefono = via === "tel";
  const digitos = PAISES[pais][2];
  const nombreOk = isFullName(nombre);
  const contactoOk = porTelefono ? tel.length === digitos : isEmail(correo);

  async function buscar() {
    setTocado(true);
    if (!nombreOk || !contactoOk) return;
    setBuscando(true);

    const datos = {
      nombre: nombre.trim(),
      ...(porTelefono
        ? { pais: PAISES[pais][0], tel }
        : { correo: correo.trim().toLowerCase() }),
    };

    let historial = null;
    try {
      historial = await buscarHistorial(datos);
    } catch {
      // Que el historial falle no puede cerrarle la puerta: sigue como
      // primera vez y agenda igual, que es lo que vino a hacer.
      historial = null;
    }
    setBuscando(false);

    actualizar({
      via,
      nombre: datos.nombre,
      pais: PAISES[pais][0],
      tel: porTelefono ? tel : reserva.tel,
      correo: porTelefono ? reserva.correo : correo.trim().toLowerCase(),
    });

    if (!historial) {
      toast(t("noHist"));
      actualizar({ modo: "nueva" });
      navigate(PATHS.menu);
      return;
    }

    guardar(historial);
    actualizar({
      nombre: historial.nombre || datos.nombre,
      estilista: historial.estilista,
      dens: historial.dens,
      plast: historial.plast,
      // El dato con el que NO entró se completa con el que tenga la agenda.
      correo: porTelefono ? historial.correo : correo.trim().toLowerCase(),
    });
    navigate(PATHS.historial);
  }

  return (
    <>
      <TitleHtml html={t("identTitulo")} style={{ marginTop: 14 }} />
      <Sub>{t("identSub")}</Sub>

      <Field
        id="i-nombre" label={t("nombreCompleto")} autoComplete="name"
        placeholder={t("nombrePh")} ref={primerCampo}
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        invalid={tocado && !nombreOk} error={t("errNombre")}
      />

      <Segmented
        value={via}
        onChange={(v) => { setVia(v); setTocado(false); }}
        options={[
          { value: "tel", label: t("celular") },
          { value: "mail", label: t("correo") },
        ]}
      />

      {porTelefono ? (
        <PhoneField
          id="i-tel" label={t("celular")} inputMode="numeric" autoComplete="tel"
          placeholder="300 000 0000"
          value={tel}
          onChange={(e) => setTel(e.target.value.replace(/\D/g, "").slice(0, 15))}
          invalid={tocado && !contactoOk} error={t("errTel", { "%n": digitos })}
          selectProps={{
            options: PAISES,
            value: pais,
            "aria-label": t("celular"),
            onChange: (e) => setPais(Number(e.target.value)),
          }}
        />
      ) : (
        <Field
          id="i-mail" label={t("correo")} type="email" inputMode="email" autoComplete="email"
          placeholder="tucorreo@mail.com"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          invalid={tocado && !contactoOk} error={t("errMail")}
        />
      )}

      <Sticky>
        <Button onClick={buscar} disabled={buscando}>
          {buscando ? t("buscando") : t("buscar")}
        </Button>
      </Sticky>

      {/* La ayuda del prototipo, solo en desarrollo. En producción le estaría
          diciendo a una clienta real que teclee un celular que no es el suyo. */}
      {import.meta.env.DEV && (
        <Html as="p" className="note" style={{ marginTop: 16 }} html={AYUDA_PROTOTIPO} />
      )}
    </>
  );
}
