/**
 * Context per la gestione dell'internazionalizzazione
 * Gestisce il cambio di lingua e il caricamento delle traduzioni
 */

import React, { createContext, useContext, useState, useEffect } from "react";

// Traduzioni
const translations = {
  it: {
    // Layout e Navigation
    "app.title": "ENVY - Environment Manager",
    "app.subtitle": "Tool interno per gestione template .env",
    "nav.generate": "Genera",
    "nav.templates": "Template",
    "nav.clients": "Clienti",
    "nav.variables": "Variabili",

    // Pagina Clienti
    "clients.title": "Clienti",
    "clients.newClient": "Nuovo Cliente",
    "clients.selectTemplate": "Seleziona Template",
    "clients.selectTemplatePlaceholder": "Seleziona un template...",
    "clients.selectTemplateHint":
      "💡 Seleziona un template per visualizzare e gestire i suoi clienti",
    "clients.noClientFound":
      "Nessun cliente trovato per questo template. Crea il primo cliente!",
    "clients.selectTemplateFirst": "Seleziona un Template",
    "clients.selectTemplateDescription":
      "Prima di gestire i clienti, devi selezionare un template dal menu a tendina sopra.\nI clienti appartengono sempre a un template specifico.",
    "clients.templateNotFound": "Template non trovato",
    "clients.variablesCount": "{{count}} variabili",
    "clients.createClientForTemplate":
      "💡 Stai creando un cliente per il template: {{templateName}}",

    // Table Headers
    "table.clientName": "Nome Cliente",
    "table.template": "Template",
    "table.configuredVariables": "Variabili Configurate",
    "table.created": "Creato",
    "table.actions": "Azioni",

    // Dialogs
    "dialog.editClient": "Modifica Cliente",
    "dialog.newClient": "Nuovo Cliente",
    "dialog.clientName": "Nome Cliente",
    "dialog.cancel": "Annulla",
    "dialog.save": "Salva",
    "dialog.create": "Crea",
    "dialog.delete": "Elimina",
    "dialog.deleteClient": "Elimina Cliente",
    "dialog.deleteClientConfirm":
      'Sei sicuro di voler eliminare il cliente <strong>"{{clientName}}"</strong>?<br/><br/>Verranno eliminate anche tutte le variabili associate a questo cliente.',
    "dialog.yes": "Sì, elimina",

    // Form Validation
    "validation.nameRequired": "Nome è obbligatorio",
    "validation.selectTemplate":
      "Seleziona prima un template per creare un cliente",
    "validation.selectBoth": "Seleziona sia un cliente che un template",

    // Messages
    "message.clientUpdated": "Cliente aggiornato con successo",
    "message.clientCreated": "Cliente creato con successo",
    "message.clientDeleted": "Cliente eliminato con successo",
    "message.loadTemplatesError": "Errore nel caricamento dei template",
    "message.loadClientsError": "Errore nel caricamento dei clienti",
    "message.saveError": "Errore durante il salvataggio",
    "message.deleteError": "Errore durante l'eliminazione",

    // Pagina Templates
    "templates.title": "Template",
    "templates.newTemplate": "Nuovo Template",
    "templates.templateName": "Nome Template",
    "templates.importFromEnv": "Importa da .env",
    "templates.noTemplatesFound":
      "Nessun template trovato. Crea il primo template!",
    "templates.variablesCount": "{{count}} variabili",
    "templates.editTemplate": "Modifica Template",
    "templates.deleteTemplate": "Elimina Template",
    "templates.deleteConfirm":
      'Sei sicuro di voler eliminare il template <strong>"{{templateName}}"</strong>?<br/><br/>Verranno eliminati anche tutti i clienti e le loro variabili associate.',
    "templates.templateUpdated": "Template aggiornato con successo",
    "templates.templateCreated": "Template creato con successo",
    "templates.templateDeleted": "Template eliminato con successo",
    "templates.envContent": "Contenuto .env",
    "templates.variablesConfiguration": "Configurazione Variabili",
    "templates.addVariable": "Aggiungi Variabile",
    "templates.removeVariable": "Rimuovi Variabile",
    "templates.variableName": "Nome Variabile",
    "templates.isCommon": "Variabile Comune",
    "templates.isRequired": "Obbligatoria",
    "templates.commonValue": "Valore Comune",
    "templates.importEnv": "Importa file .env",
    "templates.pasteEnvContent": "Incolla qui il contenuto del tuo file .env:",
    "templates.importAndParse": "Importa e Analizza",
    "templates.parsing": "Analisi...",
    "templates.insertEnvContent":
      "Inserisci il contenuto del file .env da importare",
    "templates.envImported":
      "File .env importato e convertito in template con successo!",
    "templates.addAtLeastOne": "Aggiungi almeno una variabile",
    "templates.templateVariables": "Variabili Template",
    "templates.add": "Aggiungi",
    "templates.placeholderAuto": "Placeholder automatico",
    "templates.helpTitle": "💡 Come funziona:",
    "templates.helpCommon":
      "• <strong>Variabili Comuni</strong>: Hanno lo stesso valore per tutti i clienti (es: DB_PORT=3306)",
    "templates.helpSpecific":
      "• <strong>Variabili Specifiche</strong>: Ogni cliente avrà un valore diverso (es: DB_HOST)",
    "templates.helpRequired":
      "• <strong>Variabili Obbligatorie</strong>: Devono avere un valore per generare il file .env",
    "templates.helpImport":
      "• <strong>Import .env</strong>: Importa un file esistente per creare il template velocemente",
    "templates.importExisting": "Importa File .env Esistente",
    "templates.importDescription":
      "Incolla il contenuto di un file .env esistente. Sarà convertito automaticamente in una lista di variabili comuni che manterranno i valori originali del file .env importato.",
    "templates.envFileContent": "Contenuto File .env",
    "templates.envExample":
      "# Esempio di file .env da incollare:\nDB_HOST=localhost\nDB_PORT=3306\nDB_NAME=myapp_production\nAPI_KEY=your_secret_key_here\nDEBUG=false\nMAIL_HOST=smtp.gmail.com\nMAIL_PORT=587",
    "templates.autoConversion": "Conversione automatica:",
    "templates.conversionExample":
      "DB_HOST=localhost → DB_HOST=localhost (variabile comune)\nAPI_KEY=secret123 → API_KEY=secret123 (variabile comune)",
    "templates.importAndConvert": "Importa e Converti",
    "templates.insertValue": "Inserisci valore...",

    // Pagina Generate
    "generate.title": "Genera File .env",
    "generate.selectTemplate": "Seleziona Template",
    "generate.selectClient": "Seleziona Cliente",
    "generate.generateEnv": "Genera .env",
    "generate.copyToClipboard": "Copia negli Appunti",
    "generate.downloadFile": "Scarica File",
    "generate.downloadZip": "Scarica ZIP Multiplo",
    "generate.preview": "Anteprima",
    "generate.selectTemplateFirst": "Seleziona prima un template",
    "generate.selectClientFirst": "Seleziona prima un cliente",
    "generate.generated": "File .env generato!",
    "generate.copied": "Contenuto copiato negli appunti!",
    "generate.downloaded": "File scaricato con successo!",
    "generate.selectTemplateForZip":
      "Seleziona un template per l'esportazione ZIP",
    "generate.noContentToCopy": "Nessun contenuto da copiare",
    "generate.copyError": "Errore durante la copia",
    "generate.generateError": "Errore durante la generazione",
    "generate.zipError": "Errore durante l'esportazione ZIP",
    "generate.configuration": "Configurazione",
    "generate.generatingZip": "Generazione ZIP in corso...",
    "generate.zipExport": "Esportazione ZIP",
    "generate.regenerate": "Rigenera",
    "generate.copy": "Copia",
    "generate.selectTemplateFirst":
      "Seleziona un template per abilitare l'esportazione ZIP",
    "generate.placeholderSelect":
      "Seleziona cliente e template per vedere l'anteprima...",
    "generate.placeholderGenerating": "Generazione in corso...",
    "generate.placeholderEmpty": "Nessun contenuto generato",
    "generate.generationFor":
      "Generazione per {{clientName}} con template {{templateName}}",
    "generate.missingVariables": "⚠️ Variabili obbligatorie mancanti:",
    "generate.goToVariables":
      "Vai alla pagina {{variables}} per configurare i valori mancanti.",
    "generate.zipDescription":
      "Scarica un archivio ZIP contenente i file .env generati per tutti i clienti utilizzando il template selezionato.",
    "generate.templateLabel": "Template:",
    "generate.clientLabel": "Cliente:",
    "generate.noVariablesConfigured":
      "Questo cliente non ha variabili configurate",
    "generate.emptyValue": "vuoto",

    // Pagina Variables
    "variables.title": "Variabili",
    "variables.selectTemplate": "Seleziona Template",
    "variables.selectClient": "Seleziona Cliente",
    "variables.variableName": "Nome Variabile",
    "variables.value": "Valore",
    "variables.noVariablesFound":
      "Nessuna variabile configurata per questo cliente.",
    "variables.selectTemplateFirst": "Seleziona un Template",
    "variables.selectClientFirst": "Seleziona un Cliente",
    "variables.selectBothFirst":
      "Prima seleziona un template e un cliente per visualizzare e modificare le loro variabili.",
    "variables.variableUpdated": "Variabile aggiornata con successo",
    "variables.variableDeleted": "Variabile eliminata con successo",
    "variables.deleteVariable": "Elimina Variabile",
    "variables.deleteConfirm":
      "Sei sicuro di voler eliminare la variabile <strong>{{variableName}}</strong>?",
    "variables.commonVariables": "Variabili Comuni",
    "variables.clientVariables": "Variabili Cliente",
    "variables.commonVariablesDesc":
      "Queste variabili hanno valori predefiniti dal template:",
    "variables.clientVariablesDesc":
      "Configura i valori delle variabili per questo cliente:",
    "variables.loadVariablesError": "Errore nel caricamento delle variabili",
    "variables.deleteValue": "Elimina Valore Variabile",
    "variables.deleteValueConfirm":
      'Sei sicuro di voler eliminare il valore della variabile <strong>"{{variableName}}"</strong>?',
    "variables.specificClient": "⚙️ Variabili Specifiche Cliente:",
    "variables.specificDescription":
      "Queste variabili possono avere valori diversi per ogni cliente. Clicca sui valori per modificarli.",
    "variables.clickToAdd": "Clicca per aggiungere valore",
    "variables.specific": "Specifica",
    "variables.noSpecificVariables":
      "Nessuna variabile specifica trovata per questo template.",

    // Common
    "common.loading": "Caricamento...",
    "common.variables": "variabili",
    "common.edit": "Modifica",
    "common.delete": "Elimina",
    "common.save": "Salva",
    "common.cancel": "Annulla",
  },

  en: {
    // Layout e Navigation
    "app.title": "ENVY - Environment Manager",
    "app.subtitle": "Internal tool for .env template management",
    "nav.generate": "Generate",
    "nav.templates": "Templates",
    "nav.clients": "Clients",
    "nav.variables": "Variables",

    // Pagina Clienti
    "clients.title": "Clients",
    "clients.newClient": "New Client",
    "clients.selectTemplate": "Select Template",
    "clients.selectTemplatePlaceholder": "Select a template...",
    "clients.selectTemplateHint":
      "💡 Select a template to view and manage its clients",
    "clients.noClientFound":
      "No clients found for this template. Create the first client!",
    "clients.selectTemplateFirst": "Select a Template",
    "clients.selectTemplateDescription":
      "Before managing clients, you must select a template from the dropdown above.\nClients always belong to a specific template.",
    "clients.templateNotFound": "Template not found",
    "clients.variablesCount": "{{count}} variables",
    "clients.createClientForTemplate":
      "💡 You are creating a client for template: {{templateName}}",

    // Table Headers
    "table.clientName": "Client Name",
    "table.template": "Template",
    "table.configuredVariables": "Configured Variables",
    "table.created": "Created",
    "table.actions": "Actions",

    // Dialogs
    "dialog.editClient": "Edit Client",
    "dialog.newClient": "New Client",
    "dialog.clientName": "Client Name",
    "dialog.cancel": "Cancel",
    "dialog.save": "Save",
    "dialog.create": "Create",
    "dialog.delete": "Delete",
    "dialog.deleteClient": "Delete Client",
    "dialog.deleteClientConfirm":
      'Are you sure you want to delete client <strong>"{{clientName}}"</strong>?<br/><br/>All variables associated with this client will also be deleted.',
    "dialog.yes": "Yes, delete",

    // Form Validation
    "validation.nameRequired": "Name is required",
    "validation.selectTemplate": "Select a template first to create a client",
    "validation.selectBoth": "Select both a client and a template",

    // Messages
    "message.clientUpdated": "Client updated successfully",
    "message.clientCreated": "Client created successfully",
    "message.clientDeleted": "Client deleted successfully",
    "message.loadTemplatesError": "Error loading templates",
    "message.loadClientsError": "Error loading clients",
    "message.saveError": "Error during save",
    "message.deleteError": "Error during deletion",

    // Pagina Templates
    "templates.title": "Templates",
    "templates.newTemplate": "New Template",
    "templates.templateName": "Template Name",
    "templates.importFromEnv": "Import from .env",
    "templates.noTemplatesFound":
      "No templates found. Create the first template!",
    "templates.variablesCount": "{{count}} variables",
    "templates.editTemplate": "Edit Template",
    "templates.deleteTemplate": "Delete Template",
    "templates.deleteConfirm":
      'Are you sure you want to delete template <strong>"{{templateName}}"</strong>?<br/><br/>All clients and their associated variables will also be deleted.',
    "templates.templateUpdated": "Template updated successfully",
    "templates.templateCreated": "Template created successfully",
    "templates.templateDeleted": "Template deleted successfully",
    "templates.envContent": ".env Content",
    "templates.variablesConfiguration": "Variables Configuration",
    "templates.addVariable": "Add Variable",
    "templates.removeVariable": "Remove Variable",
    "templates.variableName": "Variable Name",
    "templates.isCommon": "Common Variable",
    "templates.isRequired": "Required",
    "templates.commonValue": "Common Value",
    "templates.importEnv": "Import .env file",
    "templates.pasteEnvContent": "Paste your .env file content here:",
    "templates.importAndParse": "Import and Parse",
    "templates.parsing": "Parsing...",
    "templates.insertEnvContent": "Insert the .env file content to import",
    "templates.envImported":
      ".env file imported and converted to template successfully!",
    "templates.addAtLeastOne": "Add at least one variable",
    "templates.templateVariables": "Template Variables",
    "templates.add": "Add",
    "templates.placeholderAuto": "Automatic placeholder",
    "templates.helpTitle": "💡 How it works:",
    "templates.helpCommon":
      "• <strong>Common Variables</strong>: Have the same value for all clients (e.g.: DB_PORT=3306)",
    "templates.helpSpecific":
      "• <strong>Specific Variables</strong>: Each client will have a different value (e.g.: DB_HOST)",
    "templates.helpRequired":
      "• <strong>Required Variables</strong>: Must have a value to generate the .env file",
    "templates.helpImport":
      "• <strong>Import .env</strong>: Import an existing file to create the template quickly",
    "templates.importExisting": "Import Existing .env File",
    "templates.importDescription":
      "Paste the content of an existing .env file. It will be automatically converted into a list of common variables that will keep the original values from the imported .env file.",
    "templates.envFileContent": ".env File Content",
    "templates.envExample":
      "# Example .env file to paste:\nDB_HOST=localhost\nDB_PORT=3306\nDB_NAME=myapp_production\nAPI_KEY=your_secret_key_here\nDEBUG=false\nMAIL_HOST=smtp.gmail.com\nMAIL_PORT=587",
    "templates.autoConversion": "Automatic conversion:",
    "templates.conversionExample":
      "DB_HOST=localhost → DB_HOST=localhost (common variable)\nAPI_KEY=secret123 → API_KEY=secret123 (common variable)",
    "templates.importAndConvert": "Import and Convert",
    "templates.insertValue": "Insert value...",

    // Pagina Generate
    "generate.title": "Generate .env File",
    "generate.selectTemplate": "Select Template",
    "generate.selectClient": "Select Client",
    "generate.generateEnv": "Generate .env",
    "generate.copyToClipboard": "Copy to Clipboard",
    "generate.downloadFile": "Download File",
    "generate.downloadZip": "Download Multiple ZIP",
    "generate.preview": "Preview",
    "generate.selectTemplateFirst": "Select a template first",
    "generate.selectClientFirst": "Select a client first",
    "generate.generated": ".env file generated!",
    "generate.copied": "Content copied to clipboard!",
    "generate.downloaded": "File downloaded successfully!",
    "generate.selectTemplateForZip": "Select a template for ZIP export",
    "generate.noContentToCopy": "No content to copy",
    "generate.copyError": "Error during copy",
    "generate.generateError": "Error during generation",
    "generate.zipError": "Error during ZIP export",
    "generate.configuration": "Configuration",
    "generate.generatingZip": "Generating ZIP...",
    "generate.zipExport": "ZIP Export",
    "generate.regenerate": "Regenerate",
    "generate.copy": "Copy",
    "generate.selectTemplateFirst": "Select a template to enable ZIP export",
    "generate.placeholderSelect":
      "Select client and template to see preview...",
    "generate.placeholderGenerating": "Generating...",
    "generate.placeholderEmpty": "No content generated",
    "generate.generationFor":
      "Generation for {{clientName}} with template {{templateName}}",
    "generate.missingVariables": "⚠️ Missing required variables:",
    "generate.goToVariables":
      "Go to {{variables}} page to configure missing values.",
    "generate.zipDescription":
      "Download a ZIP archive containing .env files generated for all clients using the selected template.",
    "generate.templateLabel": "Template:",
    "generate.clientLabel": "Client:",
    "generate.noVariablesConfigured": "This client has no variables configured",
    "generate.emptyValue": "empty",

    // Pagina Variables
    "variables.title": "Variables",
    "variables.selectTemplate": "Select Template",
    "variables.selectClient": "Select Client",
    "variables.variableName": "Variable Name",
    "variables.value": "Value",
    "variables.noVariablesFound": "No variables configured for this client.",
    "variables.selectTemplateFirst": "Select a Template",
    "variables.selectClientFirst": "Select a Client",
    "variables.selectBothFirst":
      "First select a template and a client to view and modify their variables.",
    "variables.variableUpdated": "Variable updated successfully",
    "variables.variableDeleted": "Variable deleted successfully",
    "variables.deleteVariable": "Delete Variable",
    "variables.deleteConfirm":
      "Are you sure you want to delete variable <strong>{{variableName}}</strong>?",
    "variables.commonVariables": "Common Variables",
    "variables.clientVariables": "Client Variables",
    "variables.commonVariablesDesc":
      "These variables have predefined values from the template:",
    "variables.clientVariablesDesc":
      "Configure variable values for this client:",
    "variables.loadVariablesError": "Error loading variables",
    "variables.deleteValue": "Delete Variable Value",
    "variables.deleteValueConfirm":
      'Are you sure you want to delete the value of variable <strong>"{{variableName}}"</strong>?',
    "variables.specificClient": "⚙️ Client-Specific Variables:",
    "variables.specificDescription":
      "These variables can have different values for each client. Click on values to edit them.",
    "variables.clickToAdd": "Click to add value",
    "variables.specific": "Specific",
    "variables.noSpecificVariables":
      "No specific variables found for this template.",

    // Common
    "common.loading": "Loading...",
    "common.variables": "variables",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.save": "Save",
    "common.cancel": "Cancel",
  },
};

const I18nContext = createContext();

export const I18nProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Carica la lingua dal localStorage o default a italiano
    return localStorage.getItem("envy-language") || "it";
  });

  // Salva la lingua nel localStorage quando cambia
  useEffect(() => {
    localStorage.setItem("envy-language", language);
  }, [language]);

  const changeLanguage = (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguage(newLanguage);
    }
  };

  const t = (key, replacements = {}) => {
    let translation = translations[language]?.[key] || key;

    // Sostituisce i placeholder con i valori forniti
    Object.keys(replacements).forEach((placeholder) => {
      const regex = new RegExp(`{{${placeholder}}}`, "g");
      translation = translation.replace(regex, replacements[placeholder]);
    });

    return translation;
  };

  const getAvailableLanguages = () => {
    return Object.keys(translations).map((code) => ({
      code,
      name: code === "it" ? "Italiano" : "English",
      flag: code === "it" ? "🇮🇹" : "🇬🇧",
    }));
  };

  const value = {
    language,
    changeLanguage,
    t,
    getAvailableLanguages,
    languages: translations,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
};

export default I18nContext;
