import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import App from "./App";
import { LocalizationProvider } from "./contexts/LocalizationContext";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <LocalizationProvider>
      <App />
    </LocalizationProvider>
  </React.StrictMode>
);
