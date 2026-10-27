import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { agendaApi } from "../../../api/agenda";
import { buscarHistorial } from "../../../api/clientes";
import {
  ABONO, adicionalesDe, buscarServicio, densidadesDe, ETIQUETA_GRUPO,
  NOTA_GRUPO, ORDEN_GRUPOS, plasticidadDisponible, serviciosDelGrupo,
} from "../../../data/catalog";
import { useApp } from "../../../context/AppContext";
import { useHistorial } from "../useHistorial";
import { PATHS } from "../../../router/paths";
import { calcularTotal, hhmm, money, resolver, saldo } from "../../../lib/pricing";
import { aISO, fechaISOBonita, proximosDias } from "../../../lib/dates";
import { isFullName } from "../../../lib/validation";
import type { Densidad, Reserva } from "../../../types";

/* =========================================================
   La ruta con agente

   La misma cita, conversada. Llega al mismo sitio que el flujo de pantallas y
   con los mismos datos: no es una maqueta aparte, usa el catálogo, el
   historial y el cálculo de precio de siempre.

   El estado del chat se lleva en un ref y no en el estado de React porque el
   guion avanza dentro de callbacks encadenados: si cada paso leyera la
   `reserva` del render en que se creó, un servicio elegido en el mensaje
   anterior no existiría todavía al calcular el precio en el siguiente.
   ========================================================= */

type Burbuja = { de: "a" | "u"; texto: string };
type Opcion = { texto: string; primary?: boolean; al: () => void };

export default function ChatPage() {
  const navigate = useNavigate();
  const { t, lang, reserva, actualizar } = useApp();
  const { guardar } = useHistorial();

  const [log, setLog] = useState<Burbuja[]>([]);
  const [escribiendo, setEscribiendo] = useState(false);
  const [opciones, setOpciones] = useState<Opcion[]>([]);
  const [campos, setCampos] = useState<null | "id" | "datos">(null);
  const finDelLog = useRef<HTMLDivElement>(null);

  /** La reserva viva del guion. Ver el comentario del módulo. */
  const r = useRef<Reserva>(reserva);
  const sincronizar = useCallback(
    (parche: Partial<Reserva>) => {
      r.current = { ...r.current, ...parche };
      actualizar(parche);
    },
    [actualizar]
  );

  useEffect(() => {
    finDelLog.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [log, escribiendo, opciones, campos]);

  const decirYo = (texto: string) => setLog((l) => [...l, { de: "u", texto }]);

  /** El agente "escribe" antes de responder: sin la pausa el chat se siente automático */
  const decir = useCallback((texto: string, luego?: () => void) => {
    setOpciones([]);
    setCampos(null);
    setEscribiendo(true);
    setTimeout(() => {
      setEscribiendo(false);
      setLog((l) => [...l, { de: "a", texto }]);
      luego?.();
    }, 560);
  }, []);

  /* ---------- el guion ---------- */

  const pedirDia = useCallback(() => {
    const quien = r.current.estilista;
    decir(quien ? t("chatQueDiaCon", { "%e": quien }) : t("chatQueDia"), () => {
      setOpciones(
        proximosDias(5).map((d) => ({
          texto: fechaISOBonita(aISO(d), lang),
          al: () => {
            decirYo(fechaISOBonita(aISO(d), lang));
            sincronizar({ fecha: aISO(d) });
            void pedirHora();
          },
        }))
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decir, t, lang, sincronizar]);

  /**
   * Las horas las sabe la agenda, no el navegador.
   *
   * Dependen del horario de cada profesional, de sus bloqueos, de las citas
   * que ya tiene y de las retenciones de otras clientas. Ninguna de esas
   * cuatro cosas se puede calcular acá.
   */
  const pedirHora = useCallback(async () => {
    const total = calcularTotal(r.current);
    let libres: string[] = [];
    try {
      const resp = await agendaApi.disponibilidad(
        r.current.fecha!,
        total.servicioIds,
        r.current.estilistaId
      );
      libres = resp.cupos.map((c) => c.hora);
    } catch {
      // Una caída se cuenta como "ese día no hay" y se vuelve a ofrecer el
      // calendario: en un chat, un mensaje de error técnico no deja a nadie
      // más cerca de su cita.
      libres = [];
    }
    if (!libres.length) return decir(t("chatSinCupo"), pedirDia);
    decir(t("chatHoras"), () => {
      setOpciones(
        libres.map((h) => ({
          texto: h,
          al: () => {
            decirYo(h);
            sincronizar({ hora: h });
            pedirDatos();
          },
        }))
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decir, t, pedirDia, sincronizar]);

  const pedirDatos = useCallback(() => {
    if (r.current.nombre && r.current.tel) return cerrar();
    decir(t("chatPideDatos"), () => setCampos("datos"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decir, t]);

  const cerrar = useCallback(() => {
    const total = calcularTotal(r.current);
    const resumen = t("chatCierre", {
      "%s": r.current.nombre.split(" ")[0],
      "%v": total.labels.join(lang === "es" ? " y " : " and "),
      "%f": fechaISOBonita(r.current.fecha, lang),
      "%h": r.current.hora ?? "",
      "%p": total.precio,
    });
    decir(resumen, () => {
      setOpciones([
        {
          texto: t("chatTodoBien"),
          primary: true,
          al: () => {
            decirYo(t("chatTodoBien"));
            decir(
              t("chatAbono", { "%a": money(ABONO), "%s": saldo(r.current, t("elResto")) }),
              () => setOpciones([{
                texto: t("chatYaEnvie"),
                primary: true,
                al: () => navigate(PATHS.done),
              }])
            );
          },
        },
        { texto: t("chatCambiar"), al: () => { decirYo(t("chatCambiar")); pedirServicio(); } },
      ]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decir, t, lang, navigate]);

  const ofrecerExtras = useCallback(() => {
    const s = buscarServicio(r.current.svc);
    const libres = adicionalesDe(s).filter((a) => !r.current.extras.includes(a.n));
    if (!libres.length) return pedirDia();
    decir(t("chatAgregas"), () => {
      setOpciones([
        ...libres.map((a) => ({
          texto: `${a.n} (${a.p ?? ""})`,
          al: () => {
            decirYo(a.n);
            sincronizar({ extras: [...r.current.extras, a.n] });
            ofrecerExtras();
          },
        })),
        { texto: t("chatAsiEsta"), primary: true, al: () => { decirYo(t("chatAsiEsta")); pedirDia(); } },
      ]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decir, t, pedirDia, sincronizar]);

  const contarServicio = useCallback(() => {
    const s = buscarServicio(r.current.svc)!;
    const res = resolver(s, r.current.dens, r.current.plast);
    decir(
      t("chatResumenSvc", { "%s": s.nombre, "%p": res.precio, "%t": res.mins ? hhmm(res.mins) : "" }),
      ofrecerExtras
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decir, t, ofrecerExtras]);

  const pedirPlasticidad = useCallback(() => {
    const s = buscarServicio(r.current.svc)!;
    const opts: Opcion[] = [];
    if (plasticidadDisponible(s, "pa")) {
      opts.push({ texto: t("soloSe"), al: () => { decirYo(t("soloSe")); sincronizar({ plast: "pa" }); contarServicio(); } });
    }
    if (plasticidadDisponible(s, "pb")) {
      opts.push({ texto: t("ayuda"), al: () => { decirYo(t("ayuda")); sincronizar({ plast: "pb" }); contarServicio(); } });
    }
    // Con una sola plasticidad posible no hay nada que preguntar.
    if (opts.length === 1) {
      sincronizar({ plast: plasticidadDisponible(s, "pa") ? "pa" : "pb" });
      return contarServicio();
    }
    decir(t("chatPlast"), () => setOpciones(opts));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decir, t, contarServicio, sincronizar]);

  const pedirDensidad = useCallback(() => {
    const s = buscarServicio(r.current.svc)!;
    decir(t("chatDens"), () => {
      setOpciones(
        densidadesDe(s).map((d: Densidad) => ({
          texto: d,
          al: () => { decirYo(d); sincronizar({ dens: d }); pedirPlasticidad(); },
        }))
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decir, t, pedirPlasticidad, sincronizar]);

  const tomarServicio = useCallback((id: string) => {
    sincronizar({ svc: id, extras: [] });
    const s = buscarServicio(id)!;
    const seguir = () => {
      if (s.matriz && !r.current.dens) return pedirDensidad();
      contarServicio();
    };
    if (s.nota) return decir(s.nota, seguir);
    seguir();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decir, pedirDensidad, contarServicio, sincronizar]);

  const mostrarGrupo = useCallback((grupo: string) => {
    const lista = serviciosDelGrupo(grupo);
    if (lista.length === 1) return tomarServicio(lista[0].id);
    decir(NOTA_GRUPO[grupo] ?? t("chatCual"), () => {
      setOpciones([
        ...lista.map((s) => ({
          texto: `${s.nombre} · ${s.precio ?? ""}`,
          al: () => { decirYo(s.nombre); tomarServicio(s.id); },
        })),
        { texto: t("chatOtraCat"), al: () => { decirYo(t("chatOtraCat")); pedirServicio(); } },
      ]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decir, t, tomarServicio]);

  const pedirServicio = useCallback(() => {
    decir(t("chatQueServicio"), () => {
      setOpciones(
        ORDEN_GRUPOS.map((g) => ({
          texto: ETIQUETA_GRUPO[lang][g] ?? g,
          al: () => { decirYo(ETIQUETA_GRUPO[lang][g] ?? g); mostrarGrupo(g); },
        }))
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decir, t, lang, mostrarGrupo]);

  /** Arranque: una sola vez por montaje */
  const arrancado = useRef(false);
  useEffect(() => {
    if (arrancado.current) return;
    arrancado.current = true;
    r.current = { ...reserva, svc: null, extras: [] };
    decir(t("chatHola"), () => {
      setOpciones([
        { texto: t("chatSoyCliente"), primary: true, al: () => { decirYo(t("chatSoyCliente")); pedirIdentidad(); } },
        { texto: t("chatPrimeraVez"), al: () => { decirYo(t("chatPrimeraVez")); pedirServicio(); } },
      ]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pedirIdentidad() {
    decir(t("chatPideId"), () => setCampos("id"));
  }

  /**
   * Nombre Y celular, no uno de los dos.
   *
   * El backend no entrega un historial a cambio de un celular suelto: eso
   * sería un oráculo para averiguar, probando números, quién es clienta de
   * Rizos y qué se hace en el pelo.
   */
  async function identificar(nombre: string, tel: string) {
    decirYo(`${nombre} · ${tel}`);
    setCampos(null);
    sincronizar({ nombre, tel });
    const h = await buscarHistorial({
      nombre,
      pais: r.current.pais || "+57",
      tel,
    }).catch(() => null);
    if (!h || !h.servicios.length) return decir(t("chatSinHist"), pedirServicio);

    guardar(h);
    sincronizar({
      nombre: h.nombre, estilista: h.estilista, dens: h.dens, plast: h.plast, correo: h.correo,
    });
    const ultimo = h.servicios[0];
    const s = buscarServicio(ultimo.svc)!;
    decir(
      t("chatSaludo", { "%s": h.nombre.split(" ")[0], "%v": s.nombre, "%e": h.estilista, "%f": ultimo.fecha }),
      () => {
        setOpciones([
          ...h.servicios.map((pasado) => ({
            texto: t("chatRepetir", { "%s": buscarServicio(pasado.svc)?.nombre ?? "" }),
            al: () => {
              decirYo(buscarServicio(pasado.svc)?.nombre ?? "");
              sincronizar({ svc: pasado.svc, extras: [...pasado.extras], repite: true });
              ofrecerExtras();
            },
          })),
          { texto: t("chatOtro"), al: () => { decirYo(t("chatOtro")); pedirServicio(); } },
        ]);
      }
    );
  }

  return (
    <div className="chat">
      <div className="chatlog">
        {log.map((b, i) => (
          <div key={i} className={`msg ${b.de}`}>{b.texto}</div>
        ))}
        {escribiendo && <div className="msg a typing"><i /><i /><i /></div>}
        <div ref={finDelLog} />
      </div>

      <div className="quick">
        {campos === "id" && (
          <CamposDatos
            labelNombre={t("nombreCompleto")}
            labelCelular={t("celular")}
            cta={t("chatBuscar")}
            telInicial={r.current.tel}
            onEnviar={(nombre, tel) => void identificar(nombre, tel)}
          />
        )}
        {campos === "datos" && (
          <CamposDatos
            labelNombre={t("nombreCompleto")}
            labelCelular={t("celular")}
            cta={t("chatEnviar")}
            telInicial={r.current.tel}
            onEnviar={(nombre, tel) => {
              decirYo(`${nombre} · ${tel}`);
              setCampos(null);
              sincronizar({ nombre, tel });
              cerrar();
            }}
          />
        )}
        {opciones.map((o, i) => (
          <button key={`${o.texto}-${i}`} className={`chip${o.primary ? " primary" : ""}`} onClick={o.al}>
            {o.texto}
          </button>
        ))}
      </div>
    </div>
  );
}

function CamposDatos({ labelNombre, labelCelular, cta, telInicial, onEnviar }: {
  labelNombre: string; labelCelular: string; cta: string; telInicial: string;
  onEnviar: (nombre: string, tel: string) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [tel, setTel] = useState(telInicial);
  const listo = isFullName(nombre) && tel.length >= 7;
  return (
    <>
      <div className="field">
        <input autoFocus placeholder={labelNombre} value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
      <div className="field">
        <input
          inputMode="numeric" placeholder={labelCelular} value={tel}
          onChange={(e) => setTel(e.target.value.replace(/\D/g, "").slice(0, 15))}
        />
      </div>
      <button className="chip primary" disabled={!listo} onClick={() => onEnviar(nombre.trim(), tel)}>
        {cta}
      </button>
    </>
  );
}
