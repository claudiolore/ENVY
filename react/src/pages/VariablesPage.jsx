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
      showError("Errore nel caricamento dei template");
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
      showError("Errore nel caricamento dei clienti");
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
      showError("Errore nel caricamento delle variabili");
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

      showSuccess("Variabile salvata con successo");
      setEditingId(null);
      setTempValue("");
      loadVariables();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Errore durante il salvataggio";
      showError(errorMessage);
    }
  };

  const deleteVariable = async (variable) => {
    const result = await Swal.fire({
      title: "Elimina Valore Variabile",
      html: `Sei sicuro di voler eliminare il valore della variabile <strong>"${variable.key}"</strong>?`,
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
      if (variable.clientVariableId) {
        await clientVariableApi.delete({ id: variable.clientVariableId });
        showSuccess("Valore variabile eliminato con successo");
        loadVariables();
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Errore durante l'eliminazione";
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
          <Typography variant="h4">Variabili</Typography>
        </Box>
      </Box>

      {/* Selettori Template e Cliente */}
      <Box mb={3} display="flex" gap={2}>
        {/* Selettore Template */}
        <FormControl fullWidth>
          <InputLabel>Seleziona Template</InputLabel>
          <Select
            value={selectedTemplateId}
            onChange={handleTemplateChange}
            label="Seleziona Template"
            disabled={loading}
          >
            <MenuItem value="">
              <em>Seleziona un template...</em>
            </MenuItem>
            {templates.map((template) => (
              <MenuItem key={template.id} value={template.id}>
                {template.name} ({template.variables?.length || 0} variabili)
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Selettore Cliente */}
        <FormControl fullWidth disabled={!selectedTemplateId}>
          <InputLabel>Seleziona Cliente</InputLabel>
          <Select
            value={selectedClientId}
            onChange={handleClientChange}
            label="Seleziona Cliente"
            disabled={loadingClients || !selectedTemplateId}
          >
            <MenuItem value="">
              <em>Seleziona un cliente...</em>
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
          Seleziona prima un template per iniziare.
        </Alert>
      ) : !selectedClientId ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Seleziona un cliente per visualizzare e gestire le sue variabili
          d'ambiente specifiche.
        </Alert>
      ) : (
        <>
          {/* Variabili Comuni - Solo Info */}
          {commonVariables.length > 0 && (
            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                📋 Variabili Comuni (stesso valore per tutti i clienti)
              </Typography>
              <TableContainer component={Paper} elevation={1}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Chiave</TableCell>
                      <TableCell>Valore Comune</TableCell>
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
                              label="Comune"
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            {variable.isRequired && (
                              <Chip
                                label="Obbligatoria"
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
              ⚙️ Variabili Specifiche Cliente:{" "}
              <strong>
                {clients.find((c) => c.id == selectedClientId)?.name}
              </strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Queste variabili possono avere valori diversi per ogni cliente.
              Clicca sui valori per modificarli.
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
                    <TableCell>Chiave</TableCell>
                    <TableCell>Valore</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell align="center">Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {variables.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          Nessuna variabile specifica trovata per questo
                          template.
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
                                  Clicca per aggiungere valore
                                </em>
                              )}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Chip
                              label="Specifica"
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                            {variable.isRequired && (
                              <Chip
                                label="Obbligatoria"
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
