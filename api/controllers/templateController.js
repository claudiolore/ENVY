/**
 * Controller per la gestione dei Template
 * Gestisce CRUD operations per i template di file .env
 */

const {
  Template,
  TemplateVariable,
  Client,
  ClientVariable,
} = require("../models");

/**
 * Genera il contenuto del template dalle variabili
 * @param {Array} variables - Array di variabili del template
 * @returns {string} - Contenuto del template generato
 */
function generateTemplateContent(variables) {
  return variables
    .map((variable) => {
      if (variable.isCommon && variable.commonValue) {
        return `${variable.key}=${variable.commonValue}`;
      } else {
        return `${variable.key}={{${variable.key}}}`;
      }
    })
    .join("\n");
}

/**
 * Analizza i file .env e classifica le variabili
 * @param {Array} envFiles - Array di {filename, content}
 * @returns {Object} - Risultato dell'analisi
 */
function analyzeEnvFiles(envFiles) {
  if (!Array.isArray(envFiles) || envFiles.length === 0) {
    throw new Error("Almeno un file .env è necessario");
  }

  // Mappa per tracciare tutte le variabili trovate
  const variableMap = new Map();
  const clientNames = [];

  // Prima fase: estrai tutte le variabili da tutti i file
  envFiles.forEach((fileData) => {
    const { filename, content } = fileData;

    // Estrai nome del client dal filename (rimuovi estensione)
    const clientName = filename.replace(/\.env$/, "").replace(/^.*[/\\]/, "");
    clientNames.push(clientName);

    // Parse del file .env
    const lines = content.split("\n");
    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // Ignora commenti e righe vuote
      if (!trimmedLine || trimmedLine.startsWith("#")) {
        return;
      }

      // Parse variabile KEY=value
      const equalIndex = trimmedLine.indexOf("=");
      if (equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex).trim();
        const value = trimmedLine.substring(equalIndex + 1).trim();

        if (!variableMap.has(key)) {
          variableMap.set(key, new Map());
        }

        variableMap.get(key).set(clientName, value);
      }
    });
  });

  // Seconda fase: classifica le variabili
  const commonVariables = [];
  const customVariables = [];
  const partialVariables = [];

  variableMap.forEach((clientValues, variableKey) => {
    const totalFiles = envFiles.length;
    const presentInFiles = clientValues.size;
    const uniqueValues = new Set(clientValues.values());

    if (presentInFiles === totalFiles) {
      // Variabile presente in tutti i file
      if (uniqueValues.size === 1) {
        // Stesso valore in tutti i file → Comune
        const commonValue = Array.from(uniqueValues)[0];
        commonVariables.push({
          key: variableKey,
          value: commonValue,
          isCommon: true,
          isRequired: false,
        });
      } else {
        // Valori diversi nei file → Custom
        const clientValues_obj = {};
        clientValues.forEach((value, clientName) => {
          clientValues_obj[clientName] = value;
        });
        customVariables.push({
          key: variableKey,
          isCommon: false,
          isRequired: true,
          clientValues: clientValues_obj,
        });
      }
    } else {
      // Variabile presente solo in alcuni file → Parziale
      const clientValues_obj = {};
      clientValues.forEach((value, clientName) => {
        clientValues_obj[clientName] = value;
      });

      const missingClients = clientNames.filter(
        (name) => !clientValues.has(name)
      );

      partialVariables.push({
        key: variableKey,
        presentIn: Array.from(clientValues.keys()),
        missingIn: missingClients,
        clientValues: clientValues_obj,
        hasMultipleValues: uniqueValues.size > 1,
      });
    }
  });

  return {
    clientNames,
    totalFiles: envFiles.length,
    statistics: {
      commonVariables: commonVariables.length,
      customVariables: customVariables.length,
      partialVariables: partialVariables.length,
      totalVariables: variableMap.size,
    },
    variableAnalysis: {
      common: commonVariables,
      custom: customVariables,
      partial: partialVariables,
    },
  };
}

const templateController = {
  /**
   * Lista tutti i template con le relative variabili
   * POST /template/list
   */
  async list(req, res) {
    try {
      const templates = await Template.findAll({
        include: [
          {
            model: TemplateVariable,
            as: "variables",
            attributes: ["id", "key", "isCommon", "isRequired", "commonValue"],
          },
          {
            model: Client,
            as: "clients",
            attributes: ["id"], // Includo almeno l'ID per permettere il conteggio corretto
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      // Aggiungo le statistiche a ogni template
      const templatesWithStats = templates.map((template) => {
        const templateData = template.toJSON();

        // Calcolo statistiche
        const clientsCount = template.clients ? template.clients.length : 0;
        const variablesCount = template.variables
          ? template.variables.length
          : 0;

        // Rimuovo l'array clients dalla risposta per non appesantirla
        delete templateData.clients;

        return {
          ...templateData,
          stats: {
            clientsCount,
            variablesCount,
          },
        };
      });

      res.json({
        success: true,
        data: templatesWithStats,
      });
    } catch (error) {
      console.error("Errore nel recupero dei template:", error);
      res.status(500).json({
        success: false,
        error: "Errore interno del server",
      });
    }
  },

  /**
   * Crea un nuovo template con variabili
   * POST /template/create
   * Body: {name, variables: [{key, isCommon, isRequired, commonValue}]}
   */
  async create(req, res) {
    const transaction = await require("../models").sequelize.transaction();

    try {
      const { name, variables } = req.body;

      if (!name || !Array.isArray(variables) || variables.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Nome e almeno una variabile sono obbligatori",
        });
      }

      // Valida le variabili
      for (const variable of variables) {
        if (
          !variable.key ||
          typeof variable.isCommon !== "boolean" ||
          typeof variable.isRequired !== "boolean"
        ) {
          return res.status(400).json({
            success: false,
            error: "Ogni variabile deve avere key, isCommon e isRequired",
          });
        }

        // Se è comune, deve avere un valore comune
        if (variable.isCommon && !variable.commonValue) {
          return res.status(400).json({
            success: false,
            error: `La variabile comune '${variable.key}' deve avere un valore`,
          });
        }
      }

      // Genera il contenuto del template dalle variabili
      const content = generateTemplateContent(variables);

      // Crea il template
      const template = await Template.create(
        { name, content },
        { transaction }
      );

      // Crea le variabili del template
      const templateVariables = await TemplateVariable.bulkCreate(
        variables.map((variable) => ({
          templateId: template.id,
          key: variable.key,
          isCommon: variable.isCommon,
          isRequired: variable.isRequired,
          commonValue: variable.isCommon ? variable.commonValue : null,
        })),
        { transaction }
      );

      await transaction.commit();

      // Ricarica il template con le variabili per la risposta
      const templateWithVariables = await Template.findByPk(template.id, {
        include: [
          {
            model: TemplateVariable,
            as: "variables",
            attributes: ["id", "key", "isCommon", "isRequired", "commonValue"],
          },
        ],
      });

      res.json({
        success: true,
        data: templateWithVariables,
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Errore nella creazione del template:", error);

      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          success: false,
          error: "Un template con questo nome esiste già",
        });
      }

      res.status(500).json({
        success: false,
        error: "Errore interno del server",
      });
    }
  },

  /**
   * Aggiorna un template esistente con le sue variabili
   * POST /template/update
   * Body: {id, name, variables: [{key, isCommon, isRequired, commonValue}]}
   */
  async update(req, res) {
    const transaction = await require("../models").sequelize.transaction();

    try {
      const { id, name, variables } = req.body;

      if (!id || !name || !Array.isArray(variables) || variables.length === 0) {
        return res.status(400).json({
          success: false,
          error: "ID, nome e almeno una variabile sono obbligatori",
        });
      }

      const template = await Template.findByPk(id);
      if (!template) {
        return res.status(404).json({
          success: false,
          error: "Template non trovato",
        });
      }

      // Valida le variabili
      for (const variable of variables) {
        if (
          !variable.key ||
          typeof variable.isCommon !== "boolean" ||
          typeof variable.isRequired !== "boolean"
        ) {
          return res.status(400).json({
            success: false,
            error: "Ogni variabile deve avere key, isCommon e isRequired",
          });
        }

        // Se è comune, deve avere un valore comune
        if (variable.isCommon && !variable.commonValue) {
          return res.status(400).json({
            success: false,
            error: `La variabile comune '${variable.key}' deve avere un valore`,
          });
        }
      }

      // Genera il contenuto del template dalle variabili aggiornate
      const content = generateTemplateContent(variables);

      // Aggiorna il template
      await template.update({ name, content }, { transaction });

      // Elimina tutte le variabili esistenti del template
      await TemplateVariable.destroy({
        where: { templateId: id },
        transaction,
      });

      // Crea le nuove variabili del template
      const templateVariables = await TemplateVariable.bulkCreate(
        variables.map((variable) => ({
          templateId: id,
          key: variable.key,
          isCommon: variable.isCommon,
          isRequired: variable.isRequired,
          commonValue: variable.isCommon ? variable.commonValue : null,
        })),
        { transaction }
      );

      await transaction.commit();

      // Ricarica il template con le variabili per la risposta
      const templateWithVariables = await Template.findByPk(id, {
        include: [
          {
            model: TemplateVariable,
            as: "variables",
            attributes: ["id", "key", "isCommon", "isRequired", "commonValue"],
          },
        ],
      });

      res.json({
        success: true,
        data: templateWithVariables,
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Errore nell'aggiornamento del template:", error);

      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          success: false,
          error: "Un template con questo nome esiste già",
        });
      }

      res.status(500).json({
        success: false,
        error: "Errore interno del server",
      });
    }
  },

  /**
   * Elimina un template
   * POST /template/delete
   * Body: {id}
   */
  async delete(req, res) {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "ID è obbligatorio",
        });
      }

      const template = await Template.findByPk(id);
      if (!template) {
        return res.status(404).json({
          success: false,
          error: "Template non trovato",
        });
      }

      await template.destroy();

      res.json({
        success: true,
        message: "Template eliminato con successo",
      });
    } catch (error) {
      console.error("Errore nell'eliminazione del template:", error);
      res.status(500).json({
        success: false,
        error: "Errore interno del server",
      });
    }
  },

  /**
   * Analizza file .env multipli per l'importazione
   * POST /template/analyze-import
   * Body: {files: [{filename, content}]}
   */
  async analyzeImport(req, res) {
    try {
      const { files } = req.body;

      if (!Array.isArray(files) || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Almeno un file .env è necessario",
        });
      }

      // Valida che tutti i file abbiano filename e content
      for (const file of files) {
        if (!file.filename || !file.content) {
          return res.status(400).json({
            success: false,
            error: "Ogni file deve avere filename e content",
          });
        }
      }

      const analysis = analyzeEnvFiles(files);

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      console.error("Errore nell'analisi dei file .env:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Errore interno del server",
      });
    }
  },

  /**
   * Conferma l'importazione e crea template + clients + variables
   * POST /template/confirm-import
   * Body: {
   *   templateName,
   *   clientNames,
   *   variables: {common, custom, partial},
   *   partialDecisions: {variableKey: boolean}
   * }
   */
  async confirmImport(req, res) {
    const transaction = await require("../models").sequelize.transaction();

    try {
      const { templateName, clientNames, variables, partialDecisions } =
        req.body;

      if (!templateName || !Array.isArray(clientNames) || !variables) {
        return res.status(400).json({
          success: false,
          error: "templateName, clientNames e variables sono obbligatori",
        });
      }

      // Prepara tutte le variabili del template
      const allTemplateVariables = [];

      // Aggiungi variabili comuni
      if (variables.common) {
        variables.common.forEach((varData) => {
          allTemplateVariables.push({
            key: varData.key,
            isCommon: true,
            isRequired: false,
            commonValue: varData.value,
          });
        });
      }

      // Aggiungi variabili custom (placeholder nel template)
      if (variables.custom) {
        variables.custom.forEach((varData) => {
          allTemplateVariables.push({
            key: varData.key,
            isCommon: false,
            isRequired: true,
            commonValue: null,
          });
        });
      }

      // Aggiungi variabili parziali basandosi sulle decisioni dell'utente
      if (variables.partial && partialDecisions) {
        variables.partial.forEach((varData) => {
          const shouldInclude = partialDecisions[varData.key];
          if (shouldInclude) {
            // Determina se è comune o custom
            if (varData.hasMultipleValues) {
              // Valori diversi → custom
              allTemplateVariables.push({
                key: varData.key,
                isCommon: false,
                isRequired: true,
                commonValue: null,
              });
            } else {
              // Stesso valore → comune
              const existingValue = Object.values(varData.clientValues)[0];
              allTemplateVariables.push({
                key: varData.key,
                isCommon: true,
                isRequired: false,
                commonValue: existingValue,
              });
            }
          }
        });
      }

      // Genera contenuto template
      const templateContent = generateTemplateContent(allTemplateVariables);

      // 1. Crea il template
      const template = await Template.create(
        { name: templateName, content: templateContent },
        { transaction }
      );

      // 2. Crea le variabili del template
      const templateVariableRecords = await TemplateVariable.bulkCreate(
        allTemplateVariables.map((variable) => ({
          templateId: template.id,
          key: variable.key,
          isCommon: variable.isCommon,
          isRequired: variable.isRequired,
          commonValue: variable.commonValue,
        })),
        { transaction }
      );

      // 3. Crea i client
      const clientRecords = await Client.bulkCreate(
        clientNames.map((clientName) => ({
          templateId: template.id,
          name: clientName,
        })),
        { transaction }
      );

      // 4. Crea le ClientVariable per le variabili custom e parziali
      const clientVariablesToCreate = [];

      // Mappa per trovare facilmente templateVariableId per key
      const templateVariableMap = new Map();
      templateVariableRecords.forEach((tvRecord) => {
        templateVariableMap.set(tvRecord.key, tvRecord.id);
      });

      // Mappa per trovare facilmente clientId per nome
      const clientMap = new Map();
      clientRecords.forEach((clientRecord) => {
        clientMap.set(clientRecord.name, clientRecord.id);
      });

      // Aggiungi ClientVariable per variabili custom
      if (variables.custom) {
        variables.custom.forEach((varData) => {
          const templateVariableId = templateVariableMap.get(varData.key);
          if (templateVariableId) {
            Object.entries(varData.clientValues).forEach(
              ([clientName, value]) => {
                const clientId = clientMap.get(clientName);
                if (clientId) {
                  clientVariablesToCreate.push({
                    clientId,
                    templateVariableId,
                    value,
                  });
                }
              }
            );
          }
        });
      }

      // Aggiungi ClientVariable per variabili parziali incluse
      if (variables.partial && partialDecisions) {
        variables.partial.forEach((varData) => {
          const shouldInclude = partialDecisions[varData.key];
          if (shouldInclude && varData.hasMultipleValues) {
            // Solo per variabili parziali con valori diversi
            const templateVariableId = templateVariableMap.get(varData.key);
            if (templateVariableId) {
              Object.entries(varData.clientValues).forEach(
                ([clientName, value]) => {
                  const clientId = clientMap.get(clientName);
                  if (clientId) {
                    clientVariablesToCreate.push({
                      clientId,
                      templateVariableId,
                      value,
                    });
                  }
                }
              );
            }
          }
        });
      }

      // Crea tutte le ClientVariable
      if (clientVariablesToCreate.length > 0) {
        await ClientVariable.bulkCreate(clientVariablesToCreate, {
          transaction,
        });
      }

      await transaction.commit();

      // Ricarica il template completo per la risposta
      const templateWithVariables = await Template.findByPk(template.id, {
        include: [
          {
            model: TemplateVariable,
            as: "variables",
            attributes: ["id", "key", "isCommon", "isRequired", "commonValue"],
          },
        ],
      });

      res.json({
        success: true,
        data: {
          template: templateWithVariables,
          clientsCreated: clientRecords.length,
          variablesCreated: templateVariableRecords.length,
          clientVariablesCreated: clientVariablesToCreate.length,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Errore nella conferma dell'importazione:", error);

      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          success: false,
          error: "Un template con questo nome esiste già",
        });
      }

      res.status(500).json({
        success: false,
        error: error.message || "Errore interno del server",
      });
    }
  },
};

module.exports = templateController;
