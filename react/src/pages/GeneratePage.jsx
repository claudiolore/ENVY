/**
 * Pagina per la generazione di file .env e esportazione ZIP
 * Include selettori, anteprima e funzionalità di copia/download
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  Divider,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import {
  Build as GenerateIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  GetApp as ZipIcon,
  Preview as PreviewIcon,
} from "@mui/icons-material";

import {
  clientApi,
  templateApi,
  envApi,
  copyToClipboard,
  downloadBlob,
} from "../services/api.js";
import { useNotification } from "../context/NotificationContext.jsx";

const GeneratePage = () => {
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [generatedEnv, setGeneratedEnv] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingClients, setLoadingClients] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [missingVariables, setMissingVariables] = useState([]);

  const { showSuccess, showError, showInfo } = useNotification();

  // Carica i template all'avvio
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

  // Auto-genera quando cambiano client e template
  useEffect(() => {
    if (selectedClientId && selectedTemplateId) {
      handleGenerate();
    } else {
      setGeneratedEnv("");
      setMissingVariables([]);
    }
  }, [selectedClientId, selectedTemplateId]);

  const loadTemplates = async () => {
    try {
      setLoadingData(true);
      const response = await templateApi.list();
      setTemplates(response.data.data || []);
    } catch (error) {
      showError("Errore nel caricamento dei template");
      console.error("Error loading templates:", error);
    } finally {
      setLoadingData(false);
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

  const handleGenerate = async () => {
    if (!selectedClientId || !selectedTemplateId) {
      showError("Seleziona sia un cliente che un template");
      return;
    }

    try {
      setLoading(true);
      setMissingVariables([]); // Reset variabili mancanti

      const response = await envApi.generate({
        clientId: selectedClientId,
        templateId: selectedTemplateId,
      });

      setGeneratedEnv(response.data.data.envContent);
      showSuccess("File .env generato con successo");
    } catch (error) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.error || "Errore durante la generazione";

      // Se ci sono variabili obbligatorie mancanti, salvale nello state
      if (errorData?.missingVariables) {
        setMissingVariables(errorData.missingVariables);
      }

      showError(errorMessage);
      setGeneratedEnv("");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!generatedEnv) {
      showError("Nessun contenuto da copiare");
      return;
    }

    try {
      await copyToClipboard(generatedEnv);
      showSuccess("Contenuto copiato negli appunti");
    } catch (error) {
      showError("Errore durante la copia");
    }
  };

  const handleExportZip = async () => {
    if (!selectedTemplateId) {
      showError("Seleziona un template per l'esportazione ZIP");
      return;
    }

    try {
      setZipLoading(true);
      showInfo("Generazione ZIP in corso...");

      const response = await envApi.exportZip({
        templateId: selectedTemplateId,
      });

      const selectedTemplate = templates.find(
        (t) => t.id === selectedTemplateId
      );
      const filename = `env-files-${selectedTemplate?.name || "export"}.zip`;

      downloadBlob(response.data, filename);
      showSuccess("File ZIP scaricato con successo");
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Errore durante l'esportazione ZIP";
      showError(errorMessage);
    } finally {
      setZipLoading(false);
    }
  };

  const selectedClient = clients.find(
    (client) => client.id === selectedClientId
  );
  const selectedTemplate = templates.find(
    (template) => template.id === selectedTemplateId
  );

  if (loadingData) {
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
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <GenerateIcon color="primary" />
        <Typography variant="h4">Genera File .env</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Pannello di controllo */}
        <Grid item xs={12} md={6}>
          <Card elevation={1}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configurazione
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Selector template */}
                <FormControl fullWidth>
                  <InputLabel>Seleziona Template</InputLabel>
                  <Select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    label="Seleziona Template"
                  >
                    <MenuItem value="">
                      <em>Seleziona un template...</em>
                    </MenuItem>
                    {templates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name} ({template.variables?.length || 0}{" "}
                        variabili)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Selector cliente */}
                <FormControl fullWidth disabled={!selectedTemplateId}>
                  <InputLabel>Seleziona Cliente</InputLabel>
                  <Select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
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

                {/* Info selezione */}
                {selectedClient && selectedTemplate && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Generazione per <strong>{selectedClient.name}</strong> con
                    template <strong>{selectedTemplate.name}</strong>
                  </Alert>
                )}

                {/* Alert variabili mancanti */}
                {missingVariables.length > 0 && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    <Typography variant="body2" fontWeight={500} gutterBottom>
                      ⚠️ Variabili obbligatorie mancanti:
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                      {missingVariables.map((variable) => (
                        <li key={variable}>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}
                          >
                            {variable}
                          </Typography>
                        </li>
                      ))}
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Vai alla pagina <strong>Variabili</strong> per configurare
                      i valori mancanti.
                    </Typography>
                  </Alert>
                )}
              </Box>
            </CardContent>

            <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
              <Button
                onClick={handleGenerate}
                variant="contained"
                startIcon={
                  loading ? <CircularProgress size={16} /> : <PreviewIcon />
                }
                disabled={!selectedClientId || !selectedTemplateId || loading}
              >
                Rigenera
              </Button>

              <Button
                onClick={handleCopyToClipboard}
                variant="outlined"
                startIcon={<CopyIcon />}
                disabled={!generatedEnv}
              >
                Copia
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Pannello anteprima */}
        <Grid item xs={12} md={6}>
          <Card elevation={1}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Anteprima File .env
              </Typography>

              <TextField
                value={generatedEnv}
                multiline
                rows={12}
                fullWidth
                InputProps={{
                  readOnly: true,
                  sx: {
                    fontFamily: "monospace",
                    fontSize: "0.85rem",
                    backgroundColor: generatedEnv ? "grey.50" : "transparent",
                  },
                }}
                placeholder={
                  !selectedClientId || !selectedTemplateId
                    ? "Seleziona cliente e template per vedere l'anteprima..."
                    : loading
                    ? "Generazione in corso..."
                    : "Nessun contenuto generato"
                }
                variant="outlined"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sezione esportazione ZIP */}
      <Divider sx={{ my: 4 }} />

      <Card elevation={1}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <ZipIcon color="primary" />
            <Typography variant="h6">Esportazione ZIP</Typography>
          </Box>

          <Typography variant="body1" color="text.secondary" paragraph>
            Scarica un archivio ZIP contenente i file .env generati per tutti i
            clienti utilizzando il template selezionato.
          </Typography>

          {!selectedTemplateId && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Seleziona un template per abilitare l'esportazione ZIP
            </Alert>
          )}

          <Box display="flex" gap={2} alignItems="center">
            <Button
              onClick={handleExportZip}
              variant="contained"
              size="large"
              startIcon={
                zipLoading ? <CircularProgress size={16} /> : <DownloadIcon />
              }
              disabled={!selectedTemplateId || zipLoading}
            >
              {zipLoading
                ? "Generazione ZIP..."
                : "Scarica ZIP di tutti i clienti"}
            </Button>

            {selectedTemplate && (
              <Typography variant="body2" color="text.secondary">
                Template: <strong>{selectedTemplate.name}</strong>
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Info template e variabili */}
      {selectedClient && selectedTemplate && (
        <>
          <Divider sx={{ my: 4 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={1}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Template: {selectedTemplate.name}
                  </Typography>
                  <TextField
                    value={selectedTemplate.content}
                    multiline
                    rows={8}
                    fullWidth
                    InputProps={{
                      readOnly: true,
                      sx: {
                        fontFamily: "monospace",
                        fontSize: "0.8rem",
                        backgroundColor: "grey.50",
                      },
                    }}
                    variant="outlined"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={1}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cliente: {selectedClient.name}
                  </Typography>
                  {selectedClient.variables &&
                  selectedClient.variables.length > 0 ? (
                    <Box sx={{ maxHeight: 300, overflow: "auto" }}>
                      {selectedClient.variables.map((variable, index) => (
                        <Box
                          key={variable.id}
                          sx={{
                            mb: 1,
                            p: 1,
                            backgroundColor: "grey.50",
                            borderRadius: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.85rem",
                            }}
                          >
                            <strong>{variable.key}</strong> ={" "}
                            {variable.value || <em>vuoto</em>}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Alert severity="warning">
                      Questo cliente non ha variabili configurate
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default GeneratePage;
