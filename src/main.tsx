import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./i18n"; // Moved to ensure it's initialized early
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
