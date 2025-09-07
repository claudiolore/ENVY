/**
 * Pagina Home - Presentazione del progetto ENVY
 * Fornisce una panoramica delle funzionalità e quick start
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Paper,
  Chip,
  Container,
} from "@mui/material";
import {
  Description as TemplateIcon,
  People as ClientIcon,
  Analytics as AnalyzeIcon,
  CloudDownload as ExportIcon,
  Speed as AutoIcon,
  Palette as UIIcon,
} from "@mui/icons-material";

import { useI18n } from "../context/I18nContext.jsx";

const HomePage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  const features = [
    {
      icon: <TemplateIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: t("home.feature.templates.title"),
      description: t("home.feature.templates.desc"),
      action: () => navigate("/templates"),
    },
    {
      icon: <ClientIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: t("home.feature.clients.title"),
      description: t("home.feature.clients.desc"),
      action: () => navigate("/clients"),
    },
    {
      icon: <AutoIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: t("home.feature.generation.title"),
      description: t("home.feature.generation.desc"),
      action: () => navigate("/generate"),
    },
    {
      icon: <ExportIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: t("home.feature.export.title"),
      description: t("home.feature.export.desc"),
      action: () => navigate("/generate"),
    },
    {
      icon: <AnalyzeIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: t("home.feature.analysis.title"),
      description: t("home.feature.analysis.desc"),
      action: () => navigate("/analyze"),
    },
    {
      icon: <UIIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: t("home.feature.ui.title"),
      description: t("home.feature.ui.desc"),
      action: null,
    },
  ];

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ textAlign: "center", mb: 6 }}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}
        >
          {t("home.welcome")}
        </Typography>
        <Typography
          variant="h5"
          sx={{ fontWeight: 400, mb: 3, color: "text.secondary" }}
        >
          {t("home.subtitle")}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            maxWidth: "800px",
            mx: "auto",
            fontSize: "1.1rem",
            lineHeight: 1.6,
          }}
        >
          {t("home.description")}
        </Typography>
      </Box>

      {/* Features Grid */}
      <Box sx={{ mb: 6 }}>
        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.3s ease",
                  cursor: feature.action ? "pointer" : "default",
                  "&:hover": feature.action
                    ? {
                        transform: "translateY(-4px)",
                        boxShadow: 4,
                      }
                    : {},
                  border: "1px solid",
                  borderColor: "divider",
                }}
                onClick={feature.action}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: "center", p: 3 }}>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
                {feature.action && (
                  <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                    <Button size="small" color="primary">
                      {t("home.explore")}
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Call to Action */}
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
          {t("home.callToAction")}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => navigate("/analyze")}
          sx={{ px: 4, py: 1.5, fontSize: "1.1rem" }}
        >
          {t("home.startNow")}
        </Button>
      </Box>
    </Box>
  );
};

export default HomePage;
