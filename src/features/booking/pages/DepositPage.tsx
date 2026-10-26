import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { comprobanteApi, revisarArchivo } from "../../../api/comprobante";
import { ABONO, PAGOS } from "../../../data/catalog";
import { useApp } from "../../../context/AppContext";
import { useToast } from "../../../context/ToastContext";
import { PATHS } from "../../../router/paths";
import { calcularTotal, money, saldo } from "../../../lib/pricing";
import { Button, Label, Sub, Title } from "../../../components/ui";

/**
 * El abono y el comprobante.
 *
 * Subir la foto es lo que confirma la cita: no hay un botón más después. La
 * clienta paga, sube y queda agendada, que es lo que el flujo le prometió en
 * la pantalla anterior.
 *
 * Por eso el orden es estricto: primero la foto llega al bucket, y solo con
 * ella arriba se confirma la cita. Al revés quedaría una cita confirmada sin
 * comprobante, y eso la sede lo lee como una clienta que no pagó.
 *
 * Si la subida falla NO se avanza: se muestra el error y se puede reintentar
 * con la misma foto. Mandarla a "listo" con el comprobante perdido sería
 * decirle que está confirmada cuando la sede no tiene con qué verificarla.
 */
type Estado =
  | { fase: "vacio" }
  | { fase: "subiendo"; nombre: string; url: string }
  | { fase: "error"; nombre: string; url: string; archivo: File; mensaje: string };

export default function DepositPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t, reserva, actualizar } = useApp();
  const total = calcularTotal(reserva);

  const [estado, setEstado] = useState<Estado>({ fase: "vacio" });
  const urlRef = useRef<string | null>(null);
  const vivo = useRef(true);

  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
      // El blob de la miniatura se suelta al salir: cada foto que la clienta
      // cambia quedaría retenida en memoria hasta recargar.
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  function miniatura(f: File): string {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(f);
    urlRef.current = url;
    return url;
  }

  async function subir(f: File, url: string) {
    setEstado({ fase: "subiendo", nombre: f.name, url });
    try {
      const permiso = await comprobanteApi.permiso(f);
      await comprobanteApi.subir(permiso, f);
      const cita = await comprobanteApi.confirmar(permiso.clave, {
        nombre: reserva.nombre,
        celular: `${reserva.pais}${reserva.tel}`,
        correo: reserva.correo,
        servicio: reserva.svc,
        extras: reserva.extras,
        fecha: reserva.fecha,
        hora: reserva.hora,
        estilista: reserva.estilista,
      });
      if (!vivo.current) return;
      actualizar({ comprobante: { nombre: f.name, url } });
      navigate(PATHS.done, { replace: true, state: { citaId: cita.citaId } });
    } catch {
      if (!vivo.current) return;
      setEstado({ fase: "error", nombre: f.name, url, archivo: f, mensaje: t("errSubir") });
    }
  }

  function recibir(f: File) {
    const problema = revisarArchivo(f);
    if (problema) return toast(problema === "tipo" ? t("errTipo") : t("errPeso"));
    void subir(f, miniatura(f));
  }

  async function copiar(clave: keyof typeof PAGOS) {
    try {
      await navigator.clipboard.writeText(PAGOS[clave]);
    } catch {
      /* sin permiso de portapapeles: el dato igual está a la vista */
    }
    toast(t("copiado"));
  }

  const filas: Array<[titulo: string, prefijo: string, clave: keyof typeof PAGOS | null]> = [
    [t("transferencia"), `${t("ahorros")} · `, "cuenta"],
    [t("llave"), "", "llave"],
    [t("linkPago"), "", null],
  ];

  return (
    <>
      <Title style={{ marginTop: 14 }}>{t("abonoTitulo")}</Title>
      <Sub>{t("abonoSub")}</Sub>

      <div className="amount">
        <div>
          <div className="lbl">{t("abono")}</div>
          <div className="num">{money(ABONO)}</div>
        </div>
        <div className="rest">{t("pagasSalon", { "%s": saldo(reserva, t("elResto")) })}</div>
      </div>

      <Label>{t("comoPagar")}</Label>
      <div className="pay">
        {filas.map(([titulo, prefijo, clave]) => (
          <div className="prow" key={titulo}>
            <div>
              <div className="pm">{titulo}</div>
              <div className="pd">
                {prefijo}
                <span className="pend">{clave ? PAGOS[clave] : PAGOS.link}</span>
              </div>
            </div>
            {clave ? (
              <Button variant="ghost" size="sm" onClick={() => copiar(clave)}>{t("copiar")}</Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => toast(t("linkPago"))}>{t("abrirLink")}</Button>
            )}
          </div>
        ))}
      </div>

      <Label>{t("subirTitulo")}</Label>

      {estado.fase === "vacio" ? (
        <>
          <label className="drop" htmlFor="i-file">
            <div className="di">📷</div>
            <div className="dt">{t("subirDrop")}</div>
            <div className="ds">{t("subirHint")}</div>
          </label>
          <input
            id="i-file" type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              // Se limpia el input para que elegir la MISMA foto otra vez
              // vuelva a disparar el change después de un error.
              e.target.value = "";
              if (f) recibir(f);
            }}
          />
        </>
      ) : (
        <>
          <div className="thumb">
            <img src={estado.url} alt="" />
            <div>
              <div className="tn">{estado.nombre}</div>
              <div className="tm">
                {estado.fase === "subiendo" ? t("subiendo") : estado.mensaje}
              </div>
            </div>
          </div>
          {estado.fase === "error" && (
            <div className="stack" style={{ marginTop: 10 }}>
              <Button onClick={() => void subir(estado.archivo, estado.url)}>{t("reintentar")}</Button>
              <Button variant="ghost" onClick={() => setEstado({ fase: "vacio" })}>{t("cambiarFoto")}</Button>
            </div>
          )}
        </>
      )}

      {/* El total queda a la vista mientras paga: es el número que va a comparar */}
      <p className="note">{total.labels.join(" + ")} · {total.precio}</p>
    </>
  );
}
