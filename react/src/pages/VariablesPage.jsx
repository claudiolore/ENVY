/**
 * Pagina per la gestione delle Variabili
 * Include selector cliente e tabella variabili con editing inline
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
  IconButton,
  TextField,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as VariableIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";

import api, { templateApi, clientApi } from "../services/api.js";
import { useNotification } from "../context/NotificationContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import Swal from "sweetalert2";

// Importa le nuove API per client variables
const clientVariableApi = {
  list: (data) => api.post("/client-variable/list", data),
  upsert: (data) => api.post("/client-variable/upsert", data),
  delete: (data) => api.post("/client-variable/delete", data),
};

const VariablesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [variables, setVariables] = useState([]);
  const [commonVariables, setCommonVariables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingVariables, setLoadingVariables] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [tempValue, setTempValue] = useState("");

  const { showSuccess, showError } = useNotification();
  const { t } = useI18n();

  // Carica la lista dei template all'avvio
  useEffect(() => {
    loadTemplates();
  }, []);

  // Carica i clienti quando viene selezionato un template
  useEffect(() => {
    if (selectedTemplateId) {
      loadClients();
      setSelectedClientId(""); // Reset cliente selezionato
    } else {
      setClients([]);
      setSelectedClientId("");
    }
  }, [selectedTemplateId]);

  // Carica le variabili quando cambia il cliente selezionato
  useEffect(() => {
    if (selectedClientId && selectedTemplateId) {
      loadVariables();
    } else {
      setVariables([]);
      setCommonVariables([]);
    }
  }, [selectedClientId, selectedTemplateId]);

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

  const loadClients = async () => {
    if (!selectedTemplateId) return;

    try {
      setLoadingClients(true);
      const response = await clientApi.list({ templateId: selectedTemplateId });
      setClients(response.data.data || []);
    } catch (error) {
      showError(t("message.loadClientsError"));
      console.error("Error loading clients:", error);
    } finally {
      setLoadingClients(false);
    }
  };

  const loadVariables = async () => {
    if (!selectedClientId || !selectedTemplateId) return;

    try {
      setLoadingVariables(true);
      const response = await clientVariableApi.list({
        clientId: selectedClientId,
        templateId: selectedTemplateId,
      });

      const data = response.data.data;
      setVariables(data.variables || []);

      // Estrai le variabili comuni dal template per mostrarle come info
      const template = templates.find((t) => t.id == selectedTemplateId);
      const commonVars = template?.variables?.filter((v) => v.isCommon) || [];
      setCommonVariables(commonVars);
    } catch (error) {
      showError(t("variables.loadVariablesError"));
      console.error("Error loading variables:", error);
    } finally {
      setLoadingVariables(false);
    }
  };

  const handleTemplateChange = (event) => {
    setSelectedTemplateId(event.target.value);
  };

  const handleClientChange = (event) => {
    setSelectedClientId(event.target.value);
  };

  // Funzioni per editing inline
  const startEditing = (variable) => {
    setEditingId(variable.templateVariableId);
    setTempValue(variable.value);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setTempValue("");
  };

  const saveVariable = async (variable) => {
    try {
      await clientVariableApi.upsert({
        clientId: selectedClientId,
        templateVariableId: variable.templateVariableId,
        value: tempValue,
      });

      showSuccess(t("variables.variableUpdated"));
      setEditingId(null);
      setTempValue("");
      loadVariables();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || t("message.saveError");
      showError(errorMessage);
    }
  };

  const deleteVariable = async (variable) => {
    const result = await Swal.fire({
      title: t("variables.deleteValue"),
      html: t("variables.deleteValueConfirm", { variableName: variable.key }),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d32f2f",
      cancelButtonColor: "#757575",
      confirmButtonText: "Sì, elimina",
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
      if (variable.clientVariableId) {
        await clientVariableApi.delete({ id: variable.clientVariableId });
        showSuccess(t("variables.variableDeleted"));
        loadVariables();
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || t("message.deleteError");
      showError(errorMessage);
    }
  };

  const selectedClient = clients.find(
    (client) => client.id === selectedClientId
  );

  if (loadingClients) {
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
          <VariableIcon color="primary" />
          <Typography variant="h4">{t("variables.title")}</Typography>
        </Box>
      </Box>

      {/* Selettori Template e Cliente */}
      <Box mb={3} display="flex" gap={2}>
        {/* Selettore Template */}
        <FormControl fullWidth>
          <InputLabel>{t("variables.selectTemplate")}</InputLabel>
          <Select
            value={selectedTemplateId}
            onChange={handleTemplateChange}
            label={t("variables.selectTemplate")}
            disabled={loading}
          >
            <MenuItem value="">
              <em>{t("clients.selectTemplatePlaceholder")}</em>
            </MenuItem>
            {templates.map((template) => (
              <MenuItem key={template.id} value={template.id}>
                {template.name} ({template.variables?.length || 0}{" "}
                {t("common.variables")})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Selettore Cliente */}
        <FormControl fullWidth disabled={!selectedTemplateId}>
          <InputLabel>{t("variables.selectClient")}</InputLabel>
          <Select
            value={selectedClientId}
            onChange={handleClientChange}
            label={t("variables.selectClient")}
            disabled={loadingClients || !selectedTemplateId}
          >
            <MenuItem value="">
              <em>{t("clients.selectTemplatePlaceholder")}...</em>
            </MenuItem>
            {clients.map((client) => (
              <MenuItem key={client.id} value={client.id}>
                {client.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Contenuto condizionale */}
      {!selectedTemplateId ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          {t("variables.selectTemplateFirst")}
        </Alert>
      ) : !selectedClientId ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          {t("variables.selectBothFirst")}
        </Alert>
      ) : (
        <>
          {/* Variabili Comuni - Solo Info */}
          {commonVariables.length > 0 && (
            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                📋 {t("variables.commonVariables")}
              </Typography>
              <TableContainer component={Paper} elevation={1}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("variables.variableName")}</TableCell>
                      <TableCell>{t("templates.commonValue")}</TableCell>
                      <TableCell>Tipo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {commonVariables.map((variable) => (
                      <TableRow key={variable.id}>
                        <TableCell>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontFamily: "monospace", fontSize: "0.9rem" }}
                          >
                            {variable.key}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.85rem",
                              backgroundColor: "grey.50",
                              p: 0.5,
                              borderRadius: 0.5,
                              maxWidth: 300,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {variable.commonValue}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Chip
                              label={t("templates.isCommon")}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            {variable.isRequired && (
                              <Chip
                                label={t("templates.isRequired")}
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Header sezione variabili specifiche */}
          <Box mb={2}>
            <Typography variant="h6" gutterBottom>
              {t("variables.specificClient")}{" "}
              <strong>
                {clients.find((c) => c.id == selectedClientId)?.name}
              </strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("variables.specificDescription")}
            </Typography>
          </Box>

          {/* Tabella variabili specifiche cliente */}
          {loadingVariables ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="200px"
            >
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={1}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t("variables.variableName")}</TableCell>
                    <TableCell>{t("variables.value")}</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell align="center">{t("table.actions")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {variables.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          {t("variables.noSpecificVariables")}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    variables.map((variable) => (
                      <TableRow key={variable.templateVariableId} hover>
                        <TableCell>
                          <Typography
                            variant="subtitle1"
                            fontWeight={500}
                            sx={{ fontFamily: "monospace", fontSize: "0.9rem" }}
                          >
                            {variable.key}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {editingId === variable.templateVariableId ? (
                            <TextField
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              size="small"
                              fullWidth
                              autoFocus
                              sx={{ fontFamily: "monospace" }}
                            />
                          ) : (
                            <Box
                              onClick={() => startEditing(variable)}
                              sx={{
                                maxWidth: 300,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontFamily: "monospace",
                                fontSize: "0.85rem",
                                backgroundColor: variable.value
                                  ? "grey.50"
                                  : "grey.100",
                                p: 1,
                                borderRadius: 0.5,
                                cursor: "pointer",
                                "&:hover": {
                                  backgroundColor: "grey.200",
                                },
                              }}
                            >
                              {variable.value || (
                                <em style={{ color: "#999" }}>
                                  {t("variables.clickToAdd")}
                                </em>
                              )}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Chip
                              label={t("variables.specific")}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                            {variable.isRequired && (
                              <Chip
                                label={t("templates.isRequired")}
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          {editingId === variable.templateVariableId ? (
                            <Box display="flex" gap={1}>
                              <IconButton
                                onClick={() => saveVariable(variable)}
                                color="primary"
                                size="small"
                              >
                                <SaveIcon />
                              </IconButton>
                              <IconButton
                                onClick={cancelEditing}
                                color="error"
                                size="small"
                              >
                                <CancelIcon />
                              </IconButton>
                            </Box>
                          ) : (
                            <Box display="flex" gap={1}>
                              <IconButton
                                onClick={() => startEditing(variable)}
                                color="primary"
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                              {variable.value && (
                                <IconButton
                                  onClick={() => deleteVariable(variable)}
                                  color="error"
                                  size="small"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Box>
  );
};

export default VariablesPage;
