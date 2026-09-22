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
  readonly VITE_BRANCH_ID?: string;
  readonly VITE_WHATSAPP_NUMBER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
