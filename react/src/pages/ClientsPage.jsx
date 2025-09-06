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
import { useI18n } from "../context/I18nContext.jsx";
import Swal from "sweetalert2";

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
  const { t } = useI18n();

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

  const handleOpenDialog = (client = null) => {
    if (!client && !selectedTemplateId) {
      showError(t("validation.selectTemplate"));
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
    if (!formData.name.trim()) errors.name = t("validation.nameRequired");
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
        showSuccess(t("message.clientUpdated"));
      } else {
        // Create client
        await clientApi.create({
          templateId: selectedTemplateId,
          name: formData.name.trim(),
        });
        showSuccess(t("message.clientCreated"));
      }

      handleCloseDialog();
      loadClients();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || t("message.saveError");
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (client) => {
    const result = await Swal.fire({
      title: t("dialog.deleteClient"),
      html: t("dialog.deleteClientConfirm", { clientName: client.name }),
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
      await clientApi.delete({ id: client.id });
      showSuccess(t("message.clientDeleted"));
      loadClients();
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
          <Typography variant="h4">{t("clients.title")}</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          {t("clients.newClient")}
        </Button>
      </Box>

      {/* Selettore Template */}
      <Box mb={3}>
        <FormControl fullWidth>
          <InputLabel>{t("clients.selectTemplate")}</InputLabel>
          <Select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            label={t("clients.selectTemplate")}
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
        {!selectedTemplateId && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t("clients.selectTemplateHint")}
          </Typography>
        )}
      </Box>

      {/* Tabella clienti */}
      {selectedTemplateId ? (
        <TableContainer component={Paper} elevation={1}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t("table.clientName")}</TableCell>
                <TableCell>{t("table.template")}</TableCell>
                <TableCell>{t("table.configuredVariables")}</TableCell>
                <TableCell>{t("table.created")}</TableCell>
                <TableCell align="center">{t("table.actions")}</TableCell>
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
                      {t("clients.noClientFound")}
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
                        {client.template?.name || t("clients.templateNotFound")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t("clients.variablesCount", {
                          count: client.variables?.length || 0,
                        })}
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
            {t("clients.selectTemplateFirst")}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {t("clients.selectTemplateDescription")}
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
          {editingClient ? t("dialog.editClient") : t("dialog.newClient")}
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
                  {t("clients.createClientForTemplate", {
                    templateName: templates.find(
                      (template) => template.id == selectedTemplateId
                    )?.name,
                  })}
                </Typography>
              </Box>
            )}
            <TextField
              label={t("dialog.clientName")}
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
          <Button onClick={handleCloseDialog}>{t("dialog.cancel")}</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            startIcon={submitting && <CircularProgress size={16} />}
          >
            {editingClient ? t("dialog.save") : t("dialog.create")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientsPage;
