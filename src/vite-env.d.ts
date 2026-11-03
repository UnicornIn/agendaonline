/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_PREFIX?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_USE_MOCKS?: string;
  readonly VITE_ROUTER_MODE?: "browser" | "hash";
  readonly VITE_ROUTER_BASENAME?: string;
  readonly VITE_PUBLIC_BASE?: string;
  readonly VITE_DEV_PROXY_TARGET?: string;
  /** Id del píxel de Meta. Vacío = no se carga el píxel (desarrollo) */
  readonly VITE_META_PIXEL_ID?: string;
  // La sede, el WhatsApp y el abono ya no son variables de build: salen de
  // GET /public/agendamiento/config, que es donde la sede los puede cambiar
  // sin que nadie tenga que volver a desplegar la web.
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
