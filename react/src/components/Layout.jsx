/**
 * Layout principale dell'applicazione
 * Include navbar di navigazione e area contenuto
 */

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Tabs,
  Tab,
  Paper,
} from "@mui/material";
import {
  Home as HomeIcon,
  Description as TemplateIcon,
  People as ClientIcon,
  Settings as VariableIcon,
  Build as GenerateIcon,
  Analytics as AnalyzeIcon,
} from "@mui/icons-material";

import { useI18n } from "../context/I18nContext.jsx";
import LanguageSelector from "./LanguageSelector.jsx";

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();

  // Mapping delle routes per i tabs
  const routes = [
    { path: "/", label: t("nav.home"), icon: <HomeIcon /> },
    { path: "/analyze", label: t("nav.analyze"), icon: <AnalyzeIcon /> },
    { path: "/templates", label: t("nav.templates"), icon: <TemplateIcon /> },
    { path: "/clients", label: t("nav.clients"), icon: <ClientIcon /> },
    { path: "/variables", label: t("nav.variables"), icon: <VariableIcon /> },
    { path: "/generate", label: t("nav.generate"), icon: <GenerateIcon /> },
  ];

  // Trova il tab attivo basato sulla route corrente
  const currentTab = routes.findIndex(
    (route) => location.pathname === route.path
  );

  const handleTabChange = (event, newValue) => {
    navigate(routes[newValue].path);
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header con titolo e navigazione */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ backgroundColor: "primary.main" }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: 600, color: "white" }}
          >
            {t("app.title")}
          </Typography>
          <LanguageSelector />
        </Toolbar>

        {/* Tabs di navigazione */}
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            backgroundColor: "background.paper",
          }}
        >
          <Container maxWidth="lg">
            <Tabs
              value={currentTab >= 0 ? currentTab : 0}
              onChange={handleTabChange}
              aria-label="navigation tabs"
              textColor="primary"
              indicatorColor="primary"
            >
              {routes.map((route, index) => (
                <Tab
                  key={route.path}
                  icon={route.icon}
                  label={route.label}
                  iconPosition="start"
                  sx={{
                    minHeight: 64,
                    textTransform: "none",
                    fontSize: "0.95rem",
                    fontWeight: 500,
                  }}
                />
              ))}
            </Tabs>
          </Container>
        </Box>
      </AppBar>

      {/* Area contenuto principale */}
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Container maxWidth="lg">
          <Paper
            elevation={1}
            sx={{
              minHeight: "calc(100vh - 200px)",
              p: 3,
              backgroundColor: "background.paper",
              borderRadius: 2,
            }}
          >
            {children}
          </Paper>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 2,
          px: 2,
          backgroundColor: "grey.100",
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            {t("app.title")} - {t("app.subtitle")}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
