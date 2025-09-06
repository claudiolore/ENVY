/**
 * Pagina per la gestione dei Template
 * Include tabella con template e dialogs per creazione/modifica
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Chip,
  IconButton,
  Grid,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as TemplateIcon,
  FileUpload as ImportIcon,
  Remove as RemoveIcon,
} from "@mui/icons-material";

import { templateApi } from "../services/api.js";
import { useNotification } from "../context/NotificationContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import Swal from "sweetalert2";

const TemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({ name: "" });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importContent, setImportContent] = useState("");
  const [variables, setVariables] = useState([
    { key: "", isCommon: false, isRequired: false, commonValue: "" },
  ]);

  // Stati per importazione multipla
  const [importMultipleDialogOpen, setImportMultipleDialogOpen] =
    useState(false);
  const [importStep, setImportStep] = useState(1); // 1: Upload, 2: Preview, 3: Confirm
  const [importFiles, setImportFiles] = useState([]);
  const [importTemplateName, setImportTemplateName] = useState("");
  const [importAnalysis, setImportAnalysis] = useState(null);
  const [partialDecisions, setPartialDecisions] = useState({});
  const [importSubmitting, setImportSubmitting] = useState(false);

  const { showSuccess, showError } = useNotification();
  const { t } = useI18n();

  // Carica la lista dei template all'avvio
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await templateApi.list();
      setTemplates(response.data.data || []);
    } catch (error) {
      showError(t("message.loadTemplatesError"));
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template = null) => {
    setEditingTemplate(template);
    if (template) {
      setFormData({ name: template.name });
      // Usa le variabili dal template se esistono
      if (template.variables && template.variables.length > 0) {
        const templateVars = template.variables.map((variable) => ({
          key: variable.key,
          isCommon: variable.isCommon,
          isRequired: variable.isRequired,
          commonValue: variable.commonValue || "",
        }));
        setVariables(templateVars);
      } else {
        setVariables([
          { key: "", isCommon: false, isRequired: false, commonValue: "" },
        ]);
      }
    } else {
      setFormData({ name: "" });
      setVariables([
        { key: "", isCommon: false, isRequired: false, commonValue: "" },
      ]);
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setFormData({ name: "" });
    setVariables([
      { key: "", isCommon: false, isRequired: false, commonValue: "" },
    ]);
    setFormErrors({});
  };

  // Gestione variabili
  const addVariable = () => {
    setVariables([
      ...variables,
      { key: "", isCommon: false, isRequired: false, commonValue: "" },
    ]);
  };

  const removeVariable = (index) => {
    if (variables.length > 1) {
      setVariables(variables.filter((_, i) => i !== index));
    }
  };

  const updateVariable = (index, field, value) => {
    const newVariables = [...variables];
    newVariables[index] = { ...newVariables[index], [field]: value };

    // Logica mutualmente esclusiva tra comune e obbligatoria
    if (field === "isCommon" && value) {
      // Se diventa comune, non può essere obbligatoria
      newVariables[index].isRequired = false;
    } else if (field === "isRequired" && value) {
      // Se diventa obbligatoria, non può essere comune
      newVariables[index].isCommon = false;
      newVariables[index].commonValue = "";
    }

    // Se diventa non comune, svuota il valore comune
    if (field === "isCommon" && !value) {
      newVariables[index].commonValue = "";
    }

    setVariables(newVariables);
  };

  const handleOpenImportDialog = () => {
    setImportContent("");
    setImportDialogOpen(true);
  };

  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    setImportContent("");
  };

  const handleImportEnv = () => {
    if (!importContent.trim()) {
      showError(t("templates.insertEnvContent"));
      return;
    }

    // Estrai le variabili dal file .env
    const importedVars = parseEnvContentToVariables(importContent);
    setVariables(
      importedVars.length > 0
        ? importedVars
        : [{ key: "", isCommon: false, isRequired: false, commonValue: "" }]
    );

    handleCloseImportDialog();
    showSuccess(t("templates.envImported"));
  };

  // Funzione per parsare il contenuto .env e estrarre le variabili
  const parseEnvContentToVariables = (envContent) => {
    if (!envContent.trim()) return [];

    const lines = envContent.split("\n");
    const variables = [];

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // Ignora righe vuote e commenti
      if (!trimmedLine || trimmedLine.startsWith("#")) {
        return;
      }

      // Parse variabili nel formato KEY=value
      const equalIndex = trimmedLine.indexOf("=");
      if (equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex).trim();
        const value = trimmedLine.substring(equalIndex + 1).trim();
        variables.push({
          key,
          isCommon: true, // Sempre comuni quando importate da .env
          isRequired: false,
          commonValue: value, // Mantieni il valore originale dal file .env
        });
      }
    });

    return variables.length > 0
      ? variables
      : [{ key: "", isCommon: false, isRequired: false, commonValue: "" }];
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = t("validation.nameRequired");

    const validVariables = variables.filter((v) => v.key.trim());
    if (validVariables.length === 0) {
      errors.variables = t("templates.addAtLeastOne");
    } else {
      // Controlla che le variabili comuni abbiano un valore
      const commonWithoutValue = validVariables.find(
        (v) => v.isCommon && !v.commonValue.trim()
      );
      if (commonWithoutValue) {
        errors.variables = `La variabile comune '${commonWithoutValue.key}' deve avere un valore`;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      // Prepara le variabili per l'invio al backend
      const templateVariables = variables
        .filter((v) => v.key.trim())
        .map((variable) => ({
          key: variable.key.trim(),
          isCommon: variable.isCommon,
          isRequired: variable.isRequired,
          commonValue: variable.isCommon ? variable.commonValue.trim() : null,
        }));

      if (editingTemplate) {
        // Update template
        await templateApi.update({
          id: editingTemplate.id,
          name: formData.name.trim(),
          variables: templateVariables,
        });
        showSuccess(t("templates.templateUpdated"));
      } else {
        // Create template
        await templateApi.create({
          name: formData.name.trim(),
          variables: templateVariables,
        });
        showSuccess(t("templates.templateCreated"));
      }

      handleCloseDialog();
      loadTemplates();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || t("message.saveError");
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (template) => {
    const result = await Swal.fire({
      title: t("templates.deleteTemplate"),
      html: t("templates.deleteConfirm", { templateName: template.name }),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d32f2f",
      cancelButtonColor: "#757575",
      confirmButtonText: t("dialog.yes"),
      cancelButtonText: t("dialog.cancel"),
      customClass: {
        confirmButton: "swal2-button-confirm",
        cancelButton: "swal2-button-cancel",
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await templateApi.delete({ id: template.id });
      showSuccess(t("templates.templateDeleted"));
      loadTemplates();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || t("message.deleteError");
      showError(errorMessage);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // === FUNZIONI PER IMPORTAZIONE MULTIPLA ===

  const handleOpenImportMultipleDialog = () => {
    setImportMultipleDialogOpen(true);
    setImportStep(1);
    setImportFiles([]);
    setImportTemplateName("");
    setImportAnalysis(null);
    setPartialDecisions({});
    setImportSubmitting(false);
  };

  const handleCloseImportMultipleDialog = () => {
    setImportMultipleDialogOpen(false);
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

        handleCloseImportMultipleDialog();
        loadTemplates(); // Ricarica la lista
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

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <TemplateIcon color="primary" />
          <Typography variant="h4">{t("templates.title")}</Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            {t("templates.newTemplate")}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ImportIcon />}
            onClick={handleOpenImportMultipleDialog}
          >
            Import
          </Button>
        </Box>
      </Box>

      {/* Tabella template */}
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("templates.templateName")}</TableCell>
              <TableCell>{t("templates.envContent")} (anteprima)</TableCell>
              <TableCell>{t("table.created")}</TableCell>
              <TableCell align="center">{t("table.actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    {t("templates.noTemplatesFound")}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id} hover>
                  <TableCell>
                    <Typography variant="subtitle1" fontWeight={500}>
                      {template.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ maxWidth: 400 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "monospace",
                          fontSize: "0.8rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          backgroundColor: "grey.50",
                          p: 1,
                          borderRadius: 1,
                        }}
                      >
                        {template.content}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(template.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={() => handleOpenDialog(template)}
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(template)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog per creazione/modifica */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingTemplate
            ? t("templates.editTemplate")
            : t("templates.newTemplate")}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label={t("templates.templateName")}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              error={!!formErrors.name}
              helperText={formErrors.name}
              fullWidth
              autoFocus
            />

            {/* Header Variabili */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography variant="body1" fontWeight={500}>
                {t("templates.templateVariables")}
              </Typography>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ImportIcon />}
                  onClick={handleOpenImportDialog}
                >
                  {t("templates.importFromEnv")}
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addVariable}
                >
                  {t("templates.add")}
                </Button>
              </Box>
            </Box>

            {formErrors.variables && (
              <Typography color="error" variant="body2" sx={{ mb: 1 }}>
                {formErrors.variables}
              </Typography>
            )}

            {/* Lista variabili */}
            <Box sx={{ maxHeight: 500, overflow: "auto" }}>
              {variables.map((variable, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 2,
                    p: 2,
                    border: 1,
                    borderColor: "grey.300",
                    borderRadius: 1,
                    backgroundColor: "grey.50",
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    {/* Nome Variabile */}
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label={t("templates.variableName")}
                        value={variable.key}
                        onChange={(e) =>
                          updateVariable(
                            index,
                            "key",
                            e.target.value.toUpperCase()
                          )
                        }
                        placeholder="DB_HOST"
                        fullWidth
                        size="small"
                        sx={{ "& input": { fontFamily: "monospace" } }}
                      />
                    </Grid>

                    {/* Campo Valore Variabile - sempre presente */}
                    <Grid item xs={12} sm={3}>
                      {variable.isCommon ? (
                        <TextField
                          label={t("templates.commonValue")}
                          value={variable.commonValue}
                          onChange={(e) =>
                            updateVariable(index, "commonValue", e.target.value)
                          }
                          placeholder={t("templates.insertValue")}
                          fullWidth
                          size="small"
                          sx={{ "& input": { fontFamily: "monospace" } }}
                        />
                      ) : (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            height: "40px",
                            px: 1.5,
                            backgroundColor: "grey.100",
                            borderRadius: 1,
                            border: 1,
                            borderColor: "grey.300",
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.85rem",
                            }}
                          >
                            {variable.key
                              ? `{{${variable.key}}}`
                              : t("templates.placeholderAuto")}
                          </Typography>
                        </Box>
                      )}
                    </Grid>

                    {/* Checkbox Comune */}
                    <Grid item xs={6} sm={2}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={variable.isCommon}
                            disabled={variable.isRequired}
                            onChange={(e) =>
                              updateVariable(
                                index,
                                "isCommon",
                                e.target.checked
                              )
                            }
                            size="small"
                          />
                        }
                        label={t("templates.isCommon")}
                        sx={{ margin: 0 }}
                      />
                    </Grid>

                    {/* Checkbox Obbligatoria */}
                    <Grid item xs={6} sm={2}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={variable.isRequired}
                            disabled={variable.isCommon}
                            onChange={(e) =>
                              updateVariable(
                                index,
                                "isRequired",
                                e.target.checked
                              )
                            }
                            size="small"
                          />
                        }
                        label={t("templates.isRequired")}
                        sx={{ margin: 0 }}
                      />
                    </Grid>

                    {/* Pulsante Rimuovi */}
                    <Grid
                      item
                      xs={12}
                      sm={2}
                      display="flex"
                      justifyContent="center"
                    >
                      <IconButton
                        onClick={() => removeVariable(index)}
                        disabled={variables.length === 1}
                        color="error"
                        size="small"
                        sx={{
                          "&:hover": {
                            backgroundColor: "error.50",
                          },
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>

            {/* Info di aiuto */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t("templates.helpTitle")}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "0.8rem" }}
              >
                <span
                  dangerouslySetInnerHTML={{
                    __html: t("templates.helpCommon"),
                  }}
                />
                <br />
                <span
                  dangerouslySetInnerHTML={{
                    __html: t("templates.helpSpecific"),
                  }}
                />
                <br />
                <span
                  dangerouslySetInnerHTML={{
                    __html: t("templates.helpRequired"),
                  }}
                />
                <br />
                <span
                  dangerouslySetInnerHTML={{
                    __html: t("templates.helpImport"),
                  }}
                />
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t("dialog.cancel")}</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            startIcon={submitting && <CircularProgress size={16} />}
          >
            {editingTemplate ? t("dialog.save") : t("dialog.create")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog per import file .env */}
      <Dialog
        open={importDialogOpen}
        onClose={handleCloseImportDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t("templates.importExisting")}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t("templates.importDescription")}
            </Typography>

            <TextField
              label={t("templates.envFileContent")}
              value={importContent}
              onChange={(e) => setImportContent(e.target.value)}
              multiline
              rows={12}
              fullWidth
              placeholder={t("templates.envExample")}
              sx={{
                fontFamily: "monospace",
                "& textarea": { fontFamily: "monospace", fontSize: "0.9rem" },
              }}
            />

            <Box
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: "primary.50",
                borderRadius: 1,
                border: 1,
                borderColor: "primary.200",
              }}
            >
              <Typography variant="body2" fontWeight={500} gutterBottom>
                {t("templates.autoConversion")}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}
              >
                {t("templates.conversionExample")
                  .split("\n")
                  .map((line, index) => (
                    <span key={index}>
                      {line}
                      {index <
                        t("templates.conversionExample").split("\n").length -
                          1 && <br />}
                    </span>
                  ))}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportDialog}>
            {t("dialog.cancel")}
          </Button>
          <Button
            onClick={handleImportEnv}
            variant="contained"
            startIcon={<ImportIcon />}
            disabled={!importContent.trim()}
          >
            {t("templates.importAndConvert")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog per importazione multipla file .env */}
      <Dialog
        open={importMultipleDialogOpen}
        onClose={handleCloseImportMultipleDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {t("templates.importMultiple.title")}
          <Typography variant="body2" color="text.secondary">
            {t("templates.importMultiple.step")} {importStep}/2:{" "}
            {importStep === 1
              ? t("templates.importMultiple.stepUpload")
              : t("templates.importMultiple.stepPreview")}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
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
                      <Paper
                        sx={{ p: 2, textAlign: "center", bgcolor: "info.50" }}
                      >
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
                        (
                        {t(
                          "templates.importMultiple.commonVariablesDescription"
                        )}
                        )
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
                        (
                        {t(
                          "templates.importMultiple.customVariablesDescription"
                        )}
                        )
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
                        (
                        {t(
                          "templates.importMultiple.partialVariablesDescription"
                        )}
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
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportMultipleDialog}>
            {t("dialog.cancel")}
          </Button>
          {importStep === 1 && (
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
          )}
          {importStep === 2 && (
            <Button
              onClick={handleConfirmImport}
              variant="contained"
              color="success"
              disabled={importSubmitting}
              startIcon={
                importSubmitting ? <CircularProgress size={16} /> : <AddIcon />
              }
            >
              {t("templates.importMultiple.createTemplate")}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplatesPage;
