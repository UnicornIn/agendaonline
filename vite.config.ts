import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiPrefix = env.VITE_API_PREFIX || "/api/v1";

  return {
    plugins: [react()],
    // Ruta pública donde se sirve el build (p. ej. "/agenda/" si vive en un subdirectorio)
    base: env.VITE_PUBLIC_BASE || "/",
    server: {
      port: 5173,
      // En desarrollo, si defines VITE_DEV_PROXY_TARGET, las llamadas a /api/v1 se
      // redirigen al backend y te ahorras problemas de CORS.
      proxy: env.VITE_DEV_PROXY_TARGET
        ? { [apiPrefix]: { target: env.VITE_DEV_PROXY_TARGET, changeOrigin: true } }
        : undefined,
    },
  };
});
