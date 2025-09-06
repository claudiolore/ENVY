/**
 * Pagina per l'analisi e importazione multipla di file .env
 * Permette di caricare più file .env e creare template e clienti automaticamente
 */

import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  FormControl,
  Grid,
  Paper,
  Chip,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Add as AddIcon,
  FileUpload as ImportIcon,
  Analytics as AnalyzeIcon,
} from "@mui/icons-material";

import { templateApi } from "../services/api.js";
import { useNotification } from "../context/NotificationContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";

const AnalyzePage = () => {
  // Stati per importazione multipla
  const [importStep, setImportStep] = useState(1); // 1: Upload, 2: Preview
  const [importFiles, setImportFiles] = useState([]);
  const [importTemplateName, setImportTemplateName] = useState("");
  const [importAnalysis, setImportAnalysis] = useState(null);
  const [partialDecisions, setPartialDecisions] = useState({});
  const [importSubmitting, setImportSubmitting] = useState(false);

  const { showSuccess, showError } = useNotification();
  const { t } = useI18n();

  // === FUNZIONI PER IMPORTAZIONE MULTIPLA ===

  const resetForm = () => {
    setImportStep(1);
    setImportFiles([]);
    setImportTemplateName("");
    setImportAnalysis(null);
    setPartialDecisions({});
    setImportSubmitting(false);
  };

  const handleFilesUpload = (event) => {
    const files = Array.from(event.target.files);

    const envFiles = files.filter(
      (file) => file.name.endsWith(".env") || file.name.includes(".env")
    );

    if (envFiles.length === 0) {
      showError(t("templates.importMultiple.selectAtLeastOneFile"));
      return;
    }

    // Leggi il contenuto dei file
    const filePromises = envFiles.map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            filename: file.name,
            content: reader.result,
          });
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
    });

    Promise.all(filePromises)
      .then((fileContents) => {
        setImportFiles(fileContents);
        showSuccess(
          t("templates.importMultiple.filesLoadedSuccess", {
            count: fileContents.length,
          })
        );
      })
      .catch((error) => {
        console.error("Errore nel leggere i file:", error);
        showError(t("templates.importMultiple.filesLoadedError"));
      });
  };

  const handleAnalyzeFiles = async () => {
    if (!importTemplateName.trim()) {
      showError(t("templates.importMultiple.enterTemplateName"));
      return;
    }

    if (importFiles.length === 0) {
      showError(t("templates.importMultiple.loadAtLeastOneFile"));
      return;
    }

    try {
      setImportSubmitting(true);
      const response = await templateApi.analyzeImport({ files: importFiles });

      if (response.data.success) {
        setImportAnalysis(response.data.data);

        // Inizializza le decisioni per le variabili parziali
        const initialDecisions = {};
        if (response.data.data.variableAnalysis.partial) {
          response.data.data.variableAnalysis.partial.forEach((variable) => {
            initialDecisions[variable.key] = false; // Default: non includere
          });
        }
        setPartialDecisions(initialDecisions);

        setImportStep(2); // Passa al preview
        showSuccess(t("templates.importMultiple.analysisSuccess"));
      } else {
        showError(
          response.data.error || t("templates.importMultiple.analysisError")
        );
      }
    } catch (error) {
      console.error("Errore nell'analisi:", error);
      showError(
        error.response?.data?.error ||
          t("templates.importMultiple.analysisError")
      );
    } finally {
      setImportSubmitting(false);
    }
  };

  const handlePartialDecisionChange = (variableKey, include) => {
    setPartialDecisions((prev) => ({
      ...prev,
      [variableKey]: include,
    }));
  };

  const handleConfirmImport = async () => {
    if (!importAnalysis) return;

    try {
      setImportSubmitting(true);

      const response = await templateApi.confirmImport({
        templateName: importTemplateName.trim(),
        clientNames: importAnalysis.clientNames,
        variables: importAnalysis.variableAnalysis,
        partialDecisions: partialDecisions,
      });

      if (response.data.success) {
        const { template, clientsCreated, variablesCreated } =
          response.data.data;
        showSuccess(
          t("templates.importMultiple.createSuccess", {
            templateName: template.name,
            clientsCount: clientsCreated,
            variablesCount: variablesCreated,
          })
        );

        resetForm();
      } else {
        showError(
          response.data.error || t("templates.importMultiple.createError")
        );
      }
    } catch (error) {
      console.error("Errore nella conferma:", error);
      showError(
        error.response?.data?.error || t("templates.importMultiple.createError")
      );
    } finally {
      setImportSubmitting(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <AnalyzeIcon color="primary" />
        <Typography variant="h4">{t("analyze.title")}</Typography>
      </Box>

      {/* Sottotitolo */}
      <Typography variant="body1" color="text.secondary" paragraph>
        {t("analyze.description")}
      </Typography>

      {/* Contenuto principale */}
      <Paper elevation={1} sx={{ p: 3 }}>
        {/* Indicatore step */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t("templates.importMultiple.step")} {importStep}/2:{" "}
            {importStep === 1
              ? t("templates.importMultiple.stepUpload")
              : t("templates.importMultiple.stepPreview")}
          </Typography>
        </Box>

        {/* STEP 1: Upload dei file */}
        {importStep === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Nome Template */}
            <TextField
              label={t("templates.importMultiple.templateName")}
              value={importTemplateName}
              onChange={(e) => setImportTemplateName(e.target.value)}
              fullWidth
              placeholder={t(
                "templates.importMultiple.templateNamePlaceholder"
              )}
              helperText={t("templates.importMultiple.templateNameHelper")}
            />

            {/* Upload dei file */}
            <Box>
              <Typography variant="body1" fontWeight={500} gutterBottom>
                {t("templates.importMultiple.selectFiles")}
              </Typography>
              <input
                type="file"
                multiple
                accept=".env"
                onChange={handleFilesUpload}
                style={{ marginBottom: 16 }}
              />
              <Typography variant="body2" color="text.secondary">
                {t("templates.importMultiple.selectFilesDescription")}
              </Typography>
            </Box>

            {/* Preview dei file caricati */}
            {importFiles.length > 0 && (
              <Box>
                <Typography variant="body1" fontWeight={500} gutterBottom>
                  {t("templates.importMultiple.filesLoaded")} (
                  {importFiles.length})
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {importFiles.map((file, index) => (
                    <Chip
                      key={index}
                      label={file.filename}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Pulsante Analizza */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button onClick={resetForm} variant="outlined">
                {t("common.reset")}
              </Button>
              <Button
                onClick={handleAnalyzeFiles}
                variant="contained"
                disabled={
                  importSubmitting ||
                  !importTemplateName.trim() ||
                  importFiles.length === 0
                }
                startIcon={
                  importSubmitting ? (
                    <CircularProgress size={16} />
                  ) : (
                    <ImportIcon />
                  )
                }
              >
                {t("templates.importMultiple.analyzeFiles")}
              </Button>
            </Box>
          </Box>
        )}

        {/* STEP 2: Preview dell'analisi */}
        {importStep === 2 && importAnalysis && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Statistiche */}
            <Box>
              <Typography variant="h6" gutterBottom>
                {t("templates.importMultiple.analysisCompleted")}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: "center",
                      bgcolor: "success.50",
                    }}
                  >
                    <Typography variant="h4" color="success.main">
                      {importAnalysis.statistics.commonVariables}
                    </Typography>
                    <Typography variant="body2">
                      {t("templates.importMultiple.commonVariables")}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: "center",
                      bgcolor: "warning.50",
                    }}
                  >
                    <Typography variant="h4" color="warning.main">
                      {importAnalysis.statistics.customVariables}
                    </Typography>
                    <Typography variant="body2">
                      {t("templates.importMultiple.customVariables")}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: "center", bgcolor: "info.50" }}>
                    <Typography variant="h4" color="info.main">
                      {importAnalysis.statistics.partialVariables}
                    </Typography>
                    <Typography variant="body2">
                      {t("templates.importMultiple.partialVariables")}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: "center",
                      bgcolor: "primary.50",
                    }}
                  >
                    <Typography variant="h4" color="primary.main">
                      {importAnalysis.clientNames.length}
                    </Typography>
                    <Typography variant="body2">
                      {t("templates.importMultiple.clients")}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            {/* Client creati */}
            <Box>
              <Typography
                variant="body1"
                gutterBottom
                color="text.primary"
                sx={{ textAlign: "center", fontWeight: 700 }}
              >
                {t("templates.importMultiple.clientsToCreate")}
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {importAnalysis.clientNames.map((clientName, index) => (
                  <Chip
                    key={index}
                    label={clientName}
                    variant="filled"
                    sx={{
                      bgcolor: "primary.main",
                      color: "white",
                      borderRadius: 1,
                      fontWeight: 500,
                      px: 1.5,
                      py: 0.5,
                    }}
                    size="small"
                  />
                ))}
              </Box>
            </Box>

            {/* Variabili comuni */}
            {importAnalysis.variableAnalysis.common.length > 0 && (
              <Box>
                <Typography
                  variant="body1"
                  gutterBottom
                  color="text.primary"
                  sx={{ textAlign: "center" }}
                >
                  <span style={{ fontWeight: 700 }}>
                    {t("templates.importMultiple.commonVariablesSection")}
                  </span>{" "}
                  <span style={{ fontWeight: 400 }}>
                    ({t("templates.importMultiple.commonVariablesDescription")})
                  </span>
                </Typography>
                <Box>
                  {importAnalysis.variableAnalysis.common.map(
                    (variable, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 1,
                          bgcolor: "success.50",
                          borderRadius: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace" }}
                        >
                          <strong>{variable.key}</strong> = {variable.value}
                        </Typography>
                      </Box>
                    )
                  )}
                </Box>
              </Box>
            )}

            {/* Variabili custom */}
            {importAnalysis.variableAnalysis.custom.length > 0 && (
              <Box>
                <Typography
                  variant="body1"
                  gutterBottom
                  color="text.primary"
                  sx={{ textAlign: "center" }}
                >
                  <span style={{ fontWeight: 700 }}>
                    {t("templates.importMultiple.customVariablesSection")}
                  </span>{" "}
                  <span style={{ fontWeight: 400 }}>
                    ({t("templates.importMultiple.customVariablesDescription")})
                  </span>
                </Typography>
                <Box>
                  {importAnalysis.variableAnalysis.custom.map(
                    (variable, index) => (
                      <Box
                        key={index}
                        sx={{
                          mb: 1,
                          p: 2,
                          bgcolor: "warning.50",
                          borderRadius: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: "monospace",
                            fontWeight: 600,
                            mb: 1,
                          }}
                        >
                          {variable.key}
                        </Typography>
                        <Grid container spacing={1} sx={{ ml: 1 }}>
                          {Object.entries(variable.clientValues).map(
                            ([clientName, value]) => (
                              <React.Fragment key={clientName}>
                                <Grid item xs={4} sm={3}>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontWeight: 500,
                                      color: "text.secondary",
                                    }}
                                  >
                                    {clientName}:
                                  </Typography>
                                </Grid>
                                <Grid item xs={8} sm={9}>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontFamily: "monospace",
                                      wordBreak: "break-all",
                                    }}
                                  >
                                    {value}
                                  </Typography>
                                </Grid>
                              </React.Fragment>
                            )
                          )}
                        </Grid>
                      </Box>
                    )
                  )}
                </Box>
              </Box>
            )}

            {/* Variabili parziali - Richiede decisione utente */}
            {importAnalysis.variableAnalysis.partial.length > 0 && (
              <Box>
                <Typography
                  variant="body1"
                  gutterBottom
                  color="text.primary"
                  sx={{ textAlign: "center" }}
                >
                  <span style={{ fontWeight: 700 }}>
                    {t("templates.importMultiple.partialVariablesSection")}
                  </span>{" "}
                  <span style={{ fontWeight: 400 }}>
                    ({t("templates.importMultiple.partialVariablesDescription")}
                    )
                  </span>
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, textAlign: "center" }}
                >
                  {t("templates.importMultiple.partialVariablesHelper")}
                </Typography>
                <Box>
                  {importAnalysis.variableAnalysis.partial.map(
                    (variable, index) => (
                      <Box
                        key={index}
                        sx={{
                          mb: 2,
                          p: 2,
                          bgcolor: "info.50",
                          borderRadius: 1,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "monospace",
                              fontWeight: 600,
                              mb: 1,
                            }}
                          >
                            {variable.key}
                          </Typography>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={
                                  partialDecisions[variable.key] || false
                                }
                                onChange={(e) =>
                                  handlePartialDecisionChange(
                                    variable.key,
                                    e.target.checked
                                  )
                                }
                              />
                            }
                            label={t("templates.importMultiple.include")}
                          />
                        </Box>
                        {/* Layout a due colonne per ottimizzare spazio */}
                        <Grid container spacing={2} sx={{ mt: 0.25 }}>
                          {/* Colonna sinistra: Presente/Mancante */}
                          <Grid item xs={12} sm={6}>
                            {/* Lista clienti presenti */}
                            <Box sx={{ mb: 0.25 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 600,
                                  color: "text.primary",
                                  display: "block",
                                  mb: 0.1,
                                }}
                              >
                                {t("templates.importMultiple.presentIn")}
                              </Typography>
                              <Box sx={{ ml: 1 }}>
                                {variable.presentIn.map((clientName) => (
                                  <Typography
                                    key={clientName}
                                    variant="caption"
                                    display="block"
                                    sx={{
                                      color: "text.secondary",
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    • {clientName}
                                  </Typography>
                                ))}
                              </Box>
                            </Box>

                            {/* Lista clienti mancanti */}
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 600,
                                  color: "text.primary",
                                  display: "block",
                                  mb: 0.1,
                                }}
                              >
                                {t("templates.importMultiple.missingIn")}
                              </Typography>
                              <Box sx={{ ml: 1 }}>
                                {variable.missingIn.map((clientName) => (
                                  <Typography
                                    key={clientName}
                                    variant="caption"
                                    display="block"
                                    sx={{
                                      color: "text.secondary",
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    • {clientName}
                                  </Typography>
                                ))}
                              </Box>
                            </Box>
                          </Grid>

                          {/* Colonna destra: Valori trovati */}
                          <Grid item xs={12} sm={6}>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 600,
                                color: "text.primary",
                                display: "block",
                                mb: 0.1,
                              }}
                            >
                              {t("templates.importMultiple.valuesFound")}
                            </Typography>
                            <Box sx={{ ml: 1 }}>
                              {Object.entries(variable.clientValues).map(
                                ([clientName, value]) => (
                                  <Box
                                    key={clientName}
                                    sx={{
                                      mb: 0.25,
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontWeight: 500,
                                        color: "text.secondary",
                                        lineHeight: 1.2,
                                        display: "block",
                                      }}
                                    >
                                      {clientName}:
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontFamily: "monospace",
                                        wordBreak: "break-all",
                                        lineHeight: 1.2,
                                        ml: 1,
                                        display: "block",
                                      }}
                                    >
                                      {value}
                                    </Typography>
                                  </Box>
                                )
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    )
                  )}
                </Box>
              </Box>
            )}

            {/* Pulsanti azioni */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button onClick={resetForm} variant="outlined">
                {t("common.reset")}
              </Button>
              <Button
                onClick={handleConfirmImport}
                variant="contained"
                color="success"
                disabled={importSubmitting}
                startIcon={
                  importSubmitting ? (
                    <CircularProgress size={16} />
                  ) : (
                    <AddIcon />
                  )
                }
              >
                {t("templates.importMultiple.createTemplate")}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AnalyzePage;
