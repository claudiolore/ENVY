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

  const { showSuccess, showError } = useNotification();

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
      showError("Errore nel caricamento dei template");
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
      showError("Inserisci il contenuto del file .env da importare");
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
    showSuccess("File .env importato e convertito in template con successo!");
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
    if (!formData.name.trim()) errors.name = "Nome è obbligatorio";

    const validVariables = variables.filter((v) => v.key.trim());
    if (validVariables.length === 0) {
      errors.variables = "Aggiungi almeno una variabile";
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
        showSuccess("Template aggiornato con successo");
      } else {
        // Create template
        await templateApi.create({
          name: formData.name.trim(),
          variables: templateVariables,
        });
        showSuccess("Template creato con successo");
      }

      handleCloseDialog();
      loadTemplates();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Errore durante il salvataggio";
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (template) => {
    const result = await Swal.fire({
      title: "Elimina Template",
      html: `Sei sicuro di voler eliminare il template <strong>"${template.name}"</strong>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d32f2f",
      cancelButtonColor: "#757575",
      confirmButtonText: "Sì, elimina",
      cancelButtonText: "Annulla",
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
      showSuccess("Template eliminato con successo");
      loadTemplates();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Errore durante l'eliminazione";
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
          <Typography variant="h4">Template</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuovo Template
        </Button>
      </Box>

      {/* Tabella template */}
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Contenuto (anteprima)</TableCell>
              <TableCell>Creato</TableCell>
              <TableCell align="center">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    Nessun template trovato. Crea il primo template!
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
          {editingTemplate ? "Modifica Template" : "Nuovo Template"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Nome Template"
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
                Variabili Template
              </Typography>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ImportIcon />}
                  onClick={handleOpenImportDialog}
                >
                  Importa da .env
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addVariable}
                >
                  Aggiungi
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
                        label="Nome Variabile"
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
                          label="Valore Comune"
                          value={variable.commonValue}
                          onChange={(e) =>
                            updateVariable(index, "commonValue", e.target.value)
                          }
                          placeholder="Inserisci valore..."
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
                              : "Placeholder automatico"}
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
                        label="Comune"
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
                        label="Obbligatoria"
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
                💡 Come funziona:
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "0.8rem" }}
              >
                • <strong>Variabili Comuni</strong>: Hanno lo stesso valore per
                tutti i clienti (es: DB_PORT=3306)
                <br />• <strong>Variabili Specifiche</strong>: Ogni cliente avrà
                un valore diverso (es: DB_HOST)
                <br />• <strong>Variabili Obbligatorie</strong>: Devono avere un
                valore per generare il file .env
                <br />• <strong>Import .env</strong>: Importa un file esistente
                per creare il template velocemente
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annulla</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            startIcon={submitting && <CircularProgress size={16} />}
          >
            {editingTemplate ? "Salva" : "Crea"}
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
        <DialogTitle>Importa File .env Esistente</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Incolla il contenuto di un file .env esistente. Sarà convertito
              automaticamente in una lista di variabili comuni che manterranno i
              valori originali del file .env importato.
            </Typography>

            <TextField
              label="Contenuto File .env"
              value={importContent}
              onChange={(e) => setImportContent(e.target.value)}
              multiline
              rows={12}
              fullWidth
              placeholder={`# Esempio di file .env da incollare:
DB_HOST=localhost
DB_PORT=3306
DB_NAME=myapp_production
API_KEY=your_secret_key_here
DEBUG=false
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587`}
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
                Conversione automatica:
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}
              >
                DB_HOST=localhost → DB_HOST=localhost (variabile comune)
                <br />
                API_KEY=secret123 → API_KEY=secret123 (variabile comune)
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportDialog}>Annulla</Button>
          <Button
            onClick={handleImportEnv}
            variant="contained"
            startIcon={<ImportIcon />}
            disabled={!importContent.trim()}
          >
            Importa e Converti
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplatesPage;
