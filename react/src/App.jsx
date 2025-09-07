/**
 * Componente principale dell'applicazione
 * Gestisce routing e layout generale
 */

import React from "react";
import { Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";

import Layout from "./components/Layout.jsx";
import HomePage from "./pages/HomePage.jsx";
import TemplatesPage from "./pages/TemplatesPage.jsx";
import ClientsPage from "./pages/ClientsPage.jsx";
import VariablesPage from "./pages/VariablesPage.jsx";
import GeneratePage from "./pages/GeneratePage.jsx";
import AnalyzePage from "./pages/AnalyzePage.jsx";

function App() {
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/variables" element={<VariablesPage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/analyze" element={<AnalyzePage />} />
        </Routes>
      </Layout>
    </Box>
  );
}

export default App;
