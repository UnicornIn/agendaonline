import type { AvailabilitySlot } from "../../../types";

interface SlotGridProps {
  slots: AvailabilitySlot[];
  /** Etiqueta del horario seleccionado */
  value?: string;
  onChange: (slot: AvailabilitySlot) => void;
  loading: boolean;
  error: unknown;
}

export default function SlotGrid({ slots, value, onChange, loading, error }: SlotGridProps) {
  if (loading) return <p className="note">Consultando horarios…</p>;
  if (error) return <p className="note">No pudimos cargar los horarios. Intenta de nuevo.</p>;
  if (!slots.length) return <p className="note">No hay horarios donde tu servicio quepa completo este día.</p>;

  return (
    <div className="slots">
      {slots.map((s) => (
        <button
          key={s.label}
          className={`slot${!s.available ? " off" : ""}${value === s.label ? " sel" : ""}`}
          disabled={!s.available}
          onClick={() => onChange(s)}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
