import { DOW, MON, toISODate } from "../../../lib/dates";

interface DayPickerProps {
  days: Date[];
  /** YYYY-MM-DD seleccionado */
  value: string | null;
  onChange: (iso: string) => void;
}

export default function DayPicker({ days, value, onChange }: DayPickerProps) {
  return (
    <div className="days">
      {days.map((d) => {
        const iso = toISODate(d);
        return (
          <button key={iso} className={`day${iso === value ? " sel" : ""}`} onClick={() => onChange(iso)}>
            <div className="dw">{DOW[d.getDay()]}</div>
            <div className="dn">{d.getDate()}</div>
            <div className="dm">{MON[d.getMonth()]}</div>
          </button>
        );
      })}
    </div>
  );
}
