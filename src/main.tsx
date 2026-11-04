import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { asegurarFbc } from "./lib/metaPixel";
import "./styles/global.css";

const root = document.getElementById("root");
if (!root) throw new Error("No existe el elemento #root en index.html");

// Antes del render, y por eso antes de que el router toque la URL: `fbclid`
// viene en el enlace del anuncio y desaparece en cuanto la clienta avanza un
// paso. Si no se guarda acá, la visita que vino de pauta queda sin saber de
// qué anuncio vino.
asegurarFbc();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
