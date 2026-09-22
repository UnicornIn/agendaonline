import type { ButtonHTMLAttributes, CSSProperties, InputHTMLAttributes, ReactNode } from "react";
import { CheckIcon, ChevronIcon, PlayIcon } from "./Icons";

interface TextProps {
  children?: ReactNode;
  style?: CSSProperties;
}

/* ---------- Tipografía de pantalla ---------- */
export const Kicker = ({ children, style }: TextProps) => <div className="kicker" style={style}>{children}</div>;
export const Title = ({ children, style }: TextProps) => <h1 className="title" style={style}>{children}</h1>;
export const Sub = ({ children, style }: TextProps) => (children ? <p className="sub" style={style}>{children}</p> : null);
export const Label = ({ children }: TextProps) => <div className="label">{children}</div>;
export const Note = ({ children, style }: TextProps) => <p className="note" style={style}>{children}</p>;

/* ---------- Botones ---------- */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  size?: "normal" | "big";
}

export function Button({ variant = "primary", size = "normal", className = "", ...props }: ButtonProps) {
  const cls = ["btn", variant === "ghost" && "ghost", size === "big" && "big", className].filter(Boolean).join(" ");
  return <button className={cls} {...props} />;
}

export const Stack = ({ children, style }: TextProps) => <div className="stack" style={style}>{children}</div>;
export const Sticky = ({ children }: TextProps) => <div className="sticky">{children}</div>;

/* ---------- Bloques de información ---------- */
export const Callout = ({ children }: TextProps) => <div className="callout">{children}</div>;

export const BlockNote = ({ icon = "●", children }: { icon?: ReactNode; children: ReactNode }) => (
  <div className="blocknote"><span>{icon}</span><span>{children}</span></div>
);

export const CheckList = ({ items }: { items: string[] }) => (
  <div>
    {items.map((x) => (
      <div className="check" key={x}><CheckIcon /><span>{x}</span></div>
    ))}
  </div>
);

export const PriceBox = ({ price, caption }: { price: string; caption: string }) => (
  <div className="pricebox">
    <div className="big">{price}</div>
    <div className="time">{caption}</div>
  </div>
);

export type SummaryRow = [label: string, value: ReactNode];

export const SummaryTable = ({ rows }: { rows: Array<SummaryRow | false | null | undefined> }) => (
  <div className="summary">
    {rows
      .filter((r): r is SummaryRow => Boolean(r))
      .map(([k, v]) => (
        <div className="row" key={k}><span className="k">{k}</span><span className="v">{v}</span></div>
      ))}
  </div>
);

/* ---------- Tarjetas y opciones ---------- */
export function Media({ video }: { video?: string | null }) {
  return (
    <span className="media">
      {video ? <video src={video} muted loop playsInline autoPlay /> : <PlayIcon />}
    </span>
  );
}

interface MediaCardProps {
  name: string;
  hint?: string;
  video?: string | null;
  onClick: () => void;
}

/** Tarjeta con video (diagnóstico) */
export const MediaCard = ({ name, hint, video, onClick }: MediaCardProps) => (
  <button className="card" onClick={onClick}>
    <Media video={video} />
    <span className="name">{name}</span>
    {hint && <span className="hint">{hint}</span>}
  </button>
);

/** Tarjeta de texto (menú de servicios) */
export const ServiceCard = ({ name, from, onClick }: { name: string; from: string; onClick: () => void }) => (
  <button className="card txt" onClick={onClick}>
    <span className="name">{name}</span>
    <span className="from">desde {from}</span>
  </button>
);

interface HeroCardProps {
  name: string;
  desc: string;
  meta: string;
  cta?: string;
  onClick: () => void;
}

export const HeroCard = ({ name, desc, meta, cta = "Ver detalle ›", onClick }: HeroCardProps) => (
  <button className="hero" onClick={onClick}>
    <span className="hname" style={{ paddingTop: 8 }}>{name}</span>
    <span className="hdesc">{desc}</span>
    <span className="hrow"><span className="hfrom">{meta}</span><span className="hcta">{cta}</span></span>
  </button>
);

interface OptionRowProps {
  title: string;
  desc?: string;
  price: string;
  /** true = fila con check (toggle); false = fila de navegación con chevron */
  selectable?: boolean;
  selected?: boolean;
  onClick: () => void;
}

export function OptionRow({ title, desc, price, selected = false, selectable = false, onClick }: OptionRowProps) {
  return (
    <button className={`opt${selected ? " on" : ""}`} onClick={onClick} aria-pressed={selectable ? selected : undefined}>
      {selectable && <span className="tick2">{selected && <CheckIcon />}</span>}
      <span className="l">
        <span className="t">{title}</span>
        {desc && <span className="d">{desc}</span>}
      </span>
      <span className="p">{price}</span>
      {!selectable && <ChevronIcon />}
    </button>
  );
}

/* ---------- Formularios ---------- */
export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  invalid?: boolean;
}

export function Field({ label, error, invalid = false, ...inputProps }: FieldProps) {
  return (
    <div className={`field${invalid ? " bad" : ""}`}>
      {label && <label htmlFor={inputProps.id}>{label}</label>}
      <input {...inputProps} />
      {error && <div className="err">{error}</div>}
    </div>
  );
}
