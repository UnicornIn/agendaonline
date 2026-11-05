import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import { ChevronIcon } from "../../components/ui/Icons";
import { aISO, celdasDelMes, desdeISO, DOW_MIN, MES_LARGO } from "../../lib/dates";

/**
 * El calendario de mes, para las fechas que no caben en la tira de días.
 *
 * Va DEBAJO de la tira y dentro de la página, no en una capa encima. Un modal
 * en móvil pide cerrar el scroll del fondo, atrapar el foco y devolverlo al
 * salir, y cada una de esas tres es una forma distinta de dejar a la clienta
 * encerrada en una pantalla de la que no sabe salir. Acá la página solo crece:
 * el botón de atrás del teléfono sigue haciendo lo que ella espera.
 *
 * No decide nada, y es a propósito: qué días se pueden tocar sale entero de
 * `cupoPorDia`, que viene de la agenda. Ni siquiera el domingo se apaga por
 * regla —la sede atiende todos los días—, así que un domingo sin nada es un
 * domingo con la agenda llena o bloqueada, igual que cualquier otro día.
 */

interface Props {
  /** El día elegido, en ISO. */
  valor: string;
  /** El primer día que se puede elegir. */
  desde: Date;
  /** El último. Más allá no se agenda por la web. */
  hasta: Date;
  /** ISO → si ese día tiene algo libre. Que falte la clave es "no se sabe". */
  cupoPorDia: Record<string, boolean>;
  /** El mes que quedó a la vista, para que el padre pida su disponibilidad. */
  onMes: (primero: Date, ultimo: Date) => void;
  onElegir: (iso: string) => void;
}

const primeroDel = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), 1);

export default function CalendarioMes({ valor, desde, hasta, cupoPorDia, onMes, onElegir }: Props) {
  const { lang, t } = useApp();

  // Abre en el mes del día elegido y no en el de hoy: si ella ya escogió el 12
  // de diciembre y vuelve a abrir, lo que quiere ver es diciembre.
  const [mes, setMes] = useState(() => primeroDel(desdeISO(valor)));

  useEffect(() => {
    onMes(mes, new Date(mes.getFullYear(), mes.getMonth() + 1, 0));
  }, [mes, onMes]);

  const celdas = celdasDelMes(mes.getFullYear(), mes.getMonth());
  // El último día del mes anterior y el primero del siguiente: si ninguno de
  // los dos entra en el rango, ese lado no tiene nada que mostrar.
  const hayAnterior = new Date(mes.getFullYear(), mes.getMonth(), 0) >= desde;
  const haySiguiente = new Date(mes.getFullYear(), mes.getMonth() + 1, 1) <= hasta;
  const correr = (n: number) => setMes((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));

  return (
    <div className="cal">
      <div className="calhead">
        <button
          className="calnav izq"
          onClick={() => correr(-1)}
          disabled={!hayAnterior}
          aria-label={t("mesAnterior")}
        >
          <ChevronIcon />
        </button>
        <div className="calmes" aria-live="polite">
          {MES_LARGO[lang][mes.getMonth()]} {mes.getFullYear()}
        </div>
        <button
          className="calnav"
          onClick={() => correr(1)}
          disabled={!haySiguiente}
          aria-label={t("mesSiguiente")}
        >
          <ChevronIcon />
        </button>
      </div>

      <div className="caldow" aria-hidden="true">
        {DOW_MIN[lang].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="calgrid">
        {celdas.map((d, i) => {
          if (!d) return <span key={`hueco-${i}`} className="calhueco" />;
          const iso = aISO(d);
          const fuera = d < desde || d > hasta;
          const lleno = cupoPorDia[iso] === false;
          const off = fuera || lleno;
          return (
            <button
              key={iso}
              className={`calday${iso === valor ? " sel" : ""}`}
              disabled={off}
              aria-label={lleno && !fuera ? `${d.getDate()} — ${t("sinHoras")}` : undefined}
              onClick={() => onElegir(iso)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
