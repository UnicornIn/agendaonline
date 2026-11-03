import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { iniciarPixel } from "./lib/pixel";
import "./styles/global.css";

const root = document.getElementById("root");
if (!root) throw new Error("No existe el elemento #root en index.html");

// Antes del render para que el script de Meta ya vaya viajando mientras React
// pinta. Sin VITE_META_PIXEL_ID no hace nada.
iniciarPixel();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
