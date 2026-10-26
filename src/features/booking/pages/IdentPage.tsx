import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buscarHistorial } from "../../../api/clientes";
import { PAISES } from "../../../data/catalog";
import { useApp } from "../../../context/AppContext";
import { useToast } from "../../../context/ToastContext";
import { useHistorial } from "../useHistorial";
import { PATHS } from "../../../router/paths";
import { isEmail } from "../../../lib/validation";
import { Button, Field, Html, PhoneField, Segmented, Sticky, Sub, TitleHtml } from "../../../components/ui";

/**
 * Entrar con el celular o con el correo.
 *
 * Los dos caminos sirven porque la base real tiene clientas sin correo y
 * clientas con el teléfono guardado en otra forma. Obligar a uno solo deja
 * afuera justo a las de siempre, que son las que el atajo busca.
 *
 * No encontrar historial NO es un error: se avisa y se sigue al menú como
 * primera vez. Dejar a alguien atrapado en una pantalla de login porque la
 * sede nunca la registró sería perder la cita.
 */
export default function IdentPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t, reserva, actualizar } = useApp();
  const { guardar } = useHistorial();

  const [via, setVia] = useState(reserva.via);
  const [pais, setPais] = useState(() => Math.max(0, PAISES.findIndex(([c]) => c === reserva.pais)));
  const [tel, setTel] = useState(reserva.tel);
  const [correo, setCorreo] = useState(reserva.correo);
  const [malo, setMalo] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const primerCampo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setTimeout(() => primerCampo.current?.focus(), 250);
    return () => clearTimeout(id);
  }, [via]);

  const digitos = PAISES[pais][2];

  async function buscar() {
    const porTelefono = via === "tel";
    const valido = porTelefono ? tel.length === digitos : isEmail(correo);
    if (!valido) return setMalo(true);
    setMalo(false);
    setBuscando(true);

    const datos = porTelefono
      ? { pais: PAISES[pais][0], tel }
      : { correo: correo.trim().toLowerCase() };
    const historial = await buscarHistorial(datos);
    setBuscando(false);

    actualizar({
      via,
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
      nombre: historial.nombre,
      estilista: historial.estilista,
      dens: historial.dens,
      plast: historial.plast,
      correo: porTelefono ? historial.correo : correo.trim().toLowerCase(),
    });
    navigate(PATHS.historial);
  }

  return (
    <>
      <TitleHtml html={t("identTitulo")} style={{ marginTop: 14 }} />
      <Sub>{t("identSub")}</Sub>

      <Segmented
        value={via}
        onChange={(v) => { setVia(v); setMalo(false); }}
        options={[
          { value: "tel", label: t("celular") },
          { value: "mail", label: t("correo") },
        ]}
      />

      {via === "tel" ? (
        <PhoneField
          id="i-tel" label={t("celular")} inputMode="numeric" autoComplete="tel"
          placeholder="300 000 0000" ref={primerCampo}
          value={tel}
          onChange={(e) => { setTel(e.target.value.replace(/\D/g, "").slice(0, 15)); setMalo(false); }}
          invalid={malo} error={t("errTel", { "%n": digitos })}
          selectProps={{
            options: PAISES,
            value: pais,
            "aria-label": t("celular"),
            onChange: (e) => { setPais(Number(e.target.value)); setMalo(false); },
          }}
        />
      ) : (
        <Field
          id="i-mail" label={t("correo")} type="email" inputMode="email" autoComplete="email"
          placeholder="tucorreo@mail.com" ref={primerCampo}
          value={correo}
          onChange={(e) => { setCorreo(e.target.value); setMalo(false); }}
          invalid={malo} error={t("errMail")}
        />
      )}

      <Sticky>
        <Button onClick={buscar} disabled={buscando}>
          {buscando ? t("buscando") : t("buscar")}
        </Button>
      </Sticky>

      <Html as="p" className="note" style={{ marginTop: 16 }} html={t("demo")} />
    </>
  );
}
