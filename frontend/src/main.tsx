import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ForgerQueryProvider } from "./api/query";
import App from "./App.tsx";
import { I18nProvider } from "./i18n";
import "./styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <ForgerQueryProvider>
        <App />
      </ForgerQueryProvider>
    </I18nProvider>
  </StrictMode>
);
