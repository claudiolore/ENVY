/**
 * Pagina per la gestione dei Clienti
 * Include tabella con clienti e dialogs per creazione/modifica
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as ClientIcon,
} from "@mui/icons-material";

import { clientApi, templateApi } from "../services/api.js";
import { useNotification } from "../context/NotificationContext.jsx";

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingClients, setLoadingClients] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({ name: "" });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { showSuccess, showError } = useNotification();

  // Carica la lista dei template all'avvio
  useEffect(() => {
    loadTemplates();
  }, []);

  // Carica i clienti quando viene selezionato un template
  useEffect(() => {
    if (selectedTemplateId) {
      loadClients();
    } else {
      setClients([]);
    }
  }, [selectedTemplateId]);

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

  const handleOpenDialog = (client = null) => {
    if (!client && !selectedTemplateId) {
      showError("Seleziona prima un template per creare un cliente");
      return;
    }

    setEditingClient(client);
    setFormData(client ? { name: client.name } : { name: "" });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingClient(null);
    setFormData({ name: "" });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Nome è obbligatorio";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      if (editingClient) {
        // Update client
        await clientApi.update({
          id: editingClient.id,
          name: formData.name.trim(),
        });
        showSuccess("Cliente aggiornato con successo");
      } else {
        // Create client
        await clientApi.create({
          templateId: selectedTemplateId,
          name: formData.name.trim(),
        });
        showSuccess("Cliente creato con successo");
      }

      handleCloseDialog();
      loadClients();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Errore durante il salvataggio";
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (client) => {
    if (
      !window.confirm(
        `Sei sicuro di voler eliminare il cliente "${client.name}"?\n\n` +
          "Verranno eliminate anche tutte le variabili associate a questo cliente."
      )
    ) {
      return;
    }

    try {
      await clientApi.delete({ id: client.id });
      showSuccess("Cliente eliminato con successo");
      loadClients();
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
          <ClientIcon color="primary" />
          <Typography variant="h4">Clienti</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuovo Cliente
        </Button>
      </Box>

      {/* Selettore Template */}
      <Box mb={3}>
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
                {template.name} ({template.variables?.length || 0} variabili)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {!selectedTemplateId && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            💡 Seleziona un template per visualizzare e gestire i suoi clienti
          </Typography>
        )}
      </Box>

      {/* Tabella clienti */}
      {selectedTemplateId ? (
        <TableContainer component={Paper} elevation={1}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome Cliente</TableCell>
                <TableCell>Template</TableCell>
                <TableCell>Variabili Configurate</TableCell>
                <TableCell>Creato</TableCell>
                <TableCell align="center">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingClients ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Nessun cliente trovato per questo template. Crea il primo
                      cliente!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id} hover>
                    <TableCell>
                      <Typography variant="subtitle1" fontWeight={500}>
                        {client.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {client.template?.name || "Template non trovato"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${client.variables?.length || 0} variabili`}
                        variant="outlined"
                        size="small"
                        color={
                          client.variables?.length > 0 ? "primary" : "default"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(client.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => handleOpenDialog(client)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(client)}
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
      ) : (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="300px"
          sx={{
            backgroundColor: "grey.50",
            borderRadius: 1,
            border: 1,
            borderColor: "grey.300",
            p: 4,
          }}
        >
          <ClientIcon sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Seleziona un Template
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Prima di gestire i clienti, devi selezionare un template dal menu a
            tendina sopra.
            <br />I clienti appartengono sempre a un template specifico.
          </Typography>
        </Box>
      )}

      {/* Dialog per creazione/modifica */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingClient ? "Modifica Cliente" : "Nuovo Cliente"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            {!editingClient && selectedTemplateId && (
              <Box
                sx={{
                  mb: 2,
                  p: 2,
                  backgroundColor: "grey.50",
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  💡 Stai creando un cliente per il template:{" "}
                  <strong>
                    {templates.find((t) => t.id == selectedTemplateId)?.name}
                  </strong>
                </Typography>
              </Box>
            )}
            <TextField
              label="Nome Cliente"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              error={!!formErrors.name}
              helperText={formErrors.name}
              fullWidth
              autoFocus
            />
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
            {editingClient ? "Salva" : "Crea"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientsPage;
