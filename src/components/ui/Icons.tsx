/* Iconos en línea. Son pocos y pequeños: un paquete de iconos para cinco
   trazos pesa más que los cinco trazos. */

export const CheckIcon = ({ light = false }: { light?: boolean }) => (
  <svg width={light ? 12 : 15} height={light ? 12 : 15} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3 8.6l3.2 3.2L13 4.8"
      stroke={light ? "var(--bg)" : "currentColor"}
      strokeWidth={light ? 2.6 : 2.3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ChevronIcon = () => (
  <svg className="chev" width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden="true">
    <path d="M1.5 1.5L6.5 7l-5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const BackIcon = () => (
  <svg width="12" height="20" viewBox="0 0 12 20" fill="none" aria-hidden="true">
    <path d="M10 2L2 10l8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PlayIcon = () => (
  <span className="play">
    <svg width="9" height="11" viewBox="0 0 9 11" fill="none" aria-hidden="true">
      <path d="M1 1l7 4.5L1 10V1z" fill="#000" />
    </svg>
  </span>
);

export const BigTickIcon = () => (
  <svg width="34" height="34" viewBox="0 0 38 38" fill="none" aria-hidden="true">
    <path d="M9 19.5l7 7 13-14" stroke="var(--bg)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const WhatsAppIcon = () => (
  <svg
    width="17" height="17" viewBox="0 0 24 24" fill="currentColor"
    style={{ verticalAlign: -3, marginRight: 7 }} aria-hidden="true"
  >
    <path d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.8-.6-3.1-1.3-5.1-4.4-5.3-4.6-.1-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2 0 .4-.1.5l-.4.5c-.1.2-.3.3-.1.6.1.3.6 1.1 1.4 1.8 1 .9 1.8 1.2 2.1 1.3.3.1.4.1.6-.1l.8-1c.2-.2.4-.2.6-.1l2 1c.2.1.4.2.4.3.1.2.1.8-.1 1.5z" />
  </svg>
);
