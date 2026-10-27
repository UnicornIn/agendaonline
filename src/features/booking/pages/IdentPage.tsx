import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buscarHistorial } from "../../../api/clientes";
import { PAISES } from "../../../data/catalog";
import { useApp } from "../../../context/AppContext";
import { useToast } from "../../../context/ToastContext";
import { useHistorial } from "../useHistorial";
import { PATHS } from "../../../router/paths";
import { isEmail, isFullName } from "../../../lib/validation";
import { Button, Field, Html, PhoneField, Sticky, Sub, TitleHtml } from "../../../components/ui";

/**
 * Entrar con el nombre y el celular.
 *
 * Las DOS cosas, y no una. El backend no entrega un historial a cambio de un
 * celular suelto: un endpoint así es un oráculo para averiguar, probando
 * números, quién es clienta de Rizos y qué se hace en el pelo. Exigir que el
 * nombre concuerde con el guardado es lo que lo cierra.
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

  const digitos = PAISES[pais][2];
  const nombreOk = isFullName(nombre);
  const telOk = tel.length === digitos;
  // El correo es opcional acá: ayuda a encontrarla, pero no se le pide a quien
  // la sede registró sin él, que son muchas de las de siempre.
  const correoOk = !correo.trim() || isEmail(correo);

  async function buscar() {
    setTocado(true);
    if (!nombreOk || !telOk || !correoOk) return;
    setBuscando(true);

    const datos = {
      nombre: nombre.trim(),
      pais: PAISES[pais][0],
      tel,
      correo: correo.trim().toLowerCase(),
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

    actualizar({ via: "tel", nombre: datos.nombre, pais: datos.pais, tel, correo: datos.correo });

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
      correo: datos.correo || historial.correo,
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

      <PhoneField
        id="i-tel" label={t("celular")} inputMode="numeric" autoComplete="tel"
        placeholder="300 000 0000"
        value={tel}
        onChange={(e) => setTel(e.target.value.replace(/\D/g, "").slice(0, 15))}
        invalid={tocado && !telOk} error={t("errTel", { "%n": digitos })}
        selectProps={{
          options: PAISES,
          value: pais,
          "aria-label": t("celular"),
          onChange: (e) => setPais(Number(e.target.value)),
        }}
      />

      <Field
        id="i-mail" label={t("correoOpcional")} type="email" inputMode="email" autoComplete="email"
        placeholder="tucorreo@mail.com"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        invalid={tocado && !correoOk} error={t("errMail")}
      />

      <Sticky>
        <Button onClick={buscar} disabled={buscando}>
          {buscando ? t("buscando") : t("buscar")}
        </Button>
      </Sticky>

      <Html as="p" className="note" style={{ marginTop: 16 }} html={t("demo")} />
    </>
  );
}
