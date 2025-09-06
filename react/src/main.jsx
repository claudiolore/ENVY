/**
 * Entry point dell'applicazione React
 * Configura il tema, routing e providers globali
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";

import App from "./App.jsx";
import theme from "./theme.js";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { I18nProvider } from "./context/I18nContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <I18nProvider>
        <NotificationProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </NotificationProvider>
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>
);
