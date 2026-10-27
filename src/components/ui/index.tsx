import type {
  AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, InputHTMLAttributes, ReactNode, Ref, SelectHTMLAttributes,
} from "react";
import { CheckIcon, ChevronIcon, PlayIcon } from "./Icons";

interface TextProps {
  children?: ReactNode;
  style?: CSSProperties;
}

/* ---------- Tipografía de pantalla ---------- */
export const Kicker = ({ children, style }: TextProps) => <div className="kicker" style={style}>{children}</div>;
export const Title = ({ children, style }: TextProps) => <h1 className="title" style={style}>{children}</h1>;
export const Sub = ({ children, style }: TextProps) => (children ? <p className="sub" style={style}>{children}</p> : null);
export const Label = ({ children, style }: TextProps) => <div className="label" style={style}>{children}</div>;
export const Note = ({ children, style }: TextProps) => <p className="note" style={style}>{children}</p>;
export const GroupLabel = ({ children }: TextProps) => <div className="grouplbl">{children}</div>;

/**
 * Un texto del diccionario que trae `<br>` o `<b>`.
 *
 * El HTML viene de src/i18n, que es contenido nuestro y está en el repo: acá
 * nunca entra nada que la clienta haya tecleado. Si algún día un texto saliera
 * de un formulario o del backend, no puede pasar por este componente.
 */
export const Html = ({ as: Tag = "span", html, className, style }: {
  as?: "span" | "h1" | "p" | "div";
  html: string;
  className?: string;
  style?: CSSProperties;
}) => <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />;

export const TitleHtml = ({ html, style }: { html: string; style?: CSSProperties }) => (
  <Html as="h1" className="title" html={html} style={style} />
);
export const SubHtml = ({ html, style }: { html: string; style?: CSSProperties }) => (
  <Html as="p" className="sub" html={html} style={style} />
);

/* ---------- Botones ---------- */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  size?: "normal" | "big" | "sm";
}

function clasesDeBoton(variant: string, size: string, className: string) {
  return ["btn", variant === "ghost" && "ghost", size !== "normal" && size, className]
    .filter(Boolean).join(" ");
}

export function Button({ variant = "primary", size = "normal", className = "", ...props }: ButtonProps) {
  return <button className={clasesDeBoton(variant, size, className)} {...props} />;
}

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "primary" | "ghost";
  size?: "normal" | "big" | "sm";
}

/**
 * Un botón que SALE de la app: se ve igual, pero es un enlace de verdad.
 *
 * Un `<button onClick={() => location.href = ...}>` se vería igual y sería
 * peor: no se puede abrir en otra pestaña, el navegador no lo anuncia como
 * enlace y en móvil pierde el salto a la app de WhatsApp.
 */
export function ButtonLink({
  variant = "primary", size = "normal", className = "", ...props
}: ButtonLinkProps) {
  return <a className={clasesDeBoton(variant, size, className)} {...props} />;
}

export const LinkButton = ({ children, style, onClick }: TextProps & { onClick: () => void }) => (
  <button className="linkbtn" style={style} onClick={onClick}>{children}</button>
);

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
    {caption && <div className="time">{caption}</div>}
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

/* ---------- Tarjetas ---------- */
/**
 * El recuadro de una tarjeta de diagnóstico: foto, video o el marcador.
 *
 * `lleno` apaga el brillo que barre el marcador. Ese brillo dice "acá va a
 * haber algo"; encima de una foto real parece un reflejo y estorba justo
 * cuando la clienta está comparando su cabello con la imagen.
 *
 * La foto va con `alt=""`: el nombre y la pista de la tarjeta ya dicen lo que
 * la foto muestra, y repetirlo hace que un lector de pantalla lea la opción
 * dos veces.
 */
export const Media = ({ foto, video }: { foto?: string | null; video?: string | null }) => (
  <span className={`media${foto || video ? " lleno" : ""}`}>
    {video ? <video src={video} muted loop playsInline autoPlay />
      : foto ? <img src={foto} alt="" loading="lazy" decoding="async" />
      : <PlayIcon />}
  </span>
);

export const MediaCard = ({ name, hint, foto, video, disabled, onClick }: {
  name: string; hint?: string; foto?: string | null; video?: string | null;
  disabled?: boolean; onClick: () => void;
}) => (
  <button className="card" disabled={disabled} onClick={onClick}>
    <Media foto={foto} video={video} />
    <span className="name">{name}</span>
    {hint && <span className="hint">{hint}</span>}
  </button>
);

export const HeroCard = ({ tag, name, desc, price, cta, onClick }: {
  tag: string; name: string; desc: string; price: string; cta: string; onClick: () => void;
}) => (
  <button className="hero" onClick={onClick}>
    <span className="tag">{tag}</span>
    <span className="hname">{name}</span>
    <span className="hdesc">{desc}</span>
    <span className="hrow"><span>{price}</span><span>{cta}</span></span>
  </button>
);

/** Fila de navegación (chevron) o de selección múltiple (check) */
export function OptionRow({ title, desc, price, selectable = false, selected = false, onClick }: {
  title: string; desc?: string; price?: string;
  selectable?: boolean; selected?: boolean; onClick: () => void;
}) {
  return (
    <button
      className={`opt${selected ? " on" : ""}`}
      onClick={onClick}
      aria-pressed={selectable ? selected : undefined}
    >
      {selectable && <span className="tick2">{selected && <CheckIcon light />}</span>}
      <span className="l">
        <span className="t">{title}</span>
        {desc && <span className="d">{desc}</span>}
      </span>
      {price && <span className="p">{price}</span>}
      {!selectable && <ChevronIcon />}
    </button>
  );
}

/* ---------- Formularios ---------- */
export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  invalid?: boolean;
  /** React 19 pasa `ref` como una prop más; no hace falta forwardRef */
  ref?: Ref<HTMLInputElement>;
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

/** Celular con indicativo: el país decide cuántos dígitos se esperan */
export function PhoneField({ label, error, invalid = false, selectProps, ...inputProps }: FieldProps & {
  selectProps: SelectHTMLAttributes<HTMLSelectElement> & { options: Array<[string, string, number]> };
}) {
  const { options, ...select } = selectProps;
  return (
    <div className={`field${invalid ? " bad" : ""}`}>
      {label && <label htmlFor={inputProps.id}>{label}</label>}
      <div className="telrow">
        <select {...select}>
          {options.map(([codigo, bandera], i) => (
            <option key={`${codigo}-${i}`} value={i}>{bandera} {codigo}</option>
          ))}
        </select>
        <input {...inputProps} />
      </div>
      {error && <div className="err">{error}</div>}
    </div>
  );
}

/** Control segmentado de dos opciones (celular / correo) */
export const Segmented = <T extends string>({ value, options, onChange }: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) => (
  <div className="seg">
    {options.map((o) => (
      <button key={o.value} className={value === o.value ? "on" : ""} onClick={() => onChange(o.value)}>
        {o.label}
      </button>
    ))}
  </div>
);

export const Chip = ({ children, selected, onClick }: TextProps & { selected: boolean; onClick: () => void }) => (
  <button className={`chip2${selected ? " sel" : ""}`} onClick={onClick}>{children}</button>
);
