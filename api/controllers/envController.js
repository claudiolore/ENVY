/**
 * Controller per la generazione di file .env e esportazione ZIP
 * Gestisce la logica di creazione dei file di ambiente e l'export di massa
 */

const {
  Template,
  TemplateVariable,
  Client,
  ClientVariable,
} = require("../models");
const archiver = require("archiver");

const envController = {
  /**
   * Genera un singolo file .env per un cliente usando un template
   * POST /generate-env
   * Body: {clientId, templateId}
   */
  async generateEnv(req, res) {
    try {
      const { clientId, templateId } = req.body;

      if (!clientId || !templateId) {
        return res.status(400).json({
          success: false,
          error: "ID cliente e ID template sono obbligatori",
        });
      }

      // Recupera il template con le sue variabili
      const template = await Template.findByPk(templateId, {
        include: [
          {
            model: TemplateVariable,
            as: "variables",
            attributes: ["id", "key", "isCommon", "isRequired", "commonValue"],
          },
        ],
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          error: "Template non trovato",
        });
      }

      // Recupera il cliente e verifica che appartenga al template
      const client = await Client.findOne({
        where: { id: clientId, templateId },
        include: [
          {
            model: ClientVariable,
            as: "variables",
            attributes: ["templateVariableId", "value"],
          },
        ],
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          error: "Cliente non trovato o non appartiene al template",
        });
      }

      // Prepara la mappa dei valori delle variabili
      const variableValues = {};
      const missingRequired = [];

      // Processa ogni variabile del template
      for (const templateVar of template.variables) {
        if (templateVar.isCommon) {
          // Variabile comune: usa il valore dal template
          variableValues[templateVar.key] = templateVar.commonValue;
        } else {
          // Variabile non comune: cerca il valore nelle ClientVariable
          const clientVar = client.variables.find(
            (cv) => cv.templateVariableId === templateVar.id
          );

          if (clientVar && clientVar.value) {
            variableValues[templateVar.key] = clientVar.value;
          } else {
            // Nessun valore trovato
            if (templateVar.isRequired) {
              missingRequired.push(templateVar.key);
            } else {
              variableValues[templateVar.key] = "";
            }
          }
        }
      }

      // Controlla se ci sono variabili obbligatorie mancanti
      if (missingRequired.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Variabili obbligatorie mancanti: ${missingRequired.join(
            ", "
          )}`,
          missingVariables: missingRequired,
        });
      }

      // Genera il contenuto del file .env
      let envContent = template.variables
        .map((variable) => `${variable.key}=${variableValues[variable.key]}`)
        .join("\n");

      res.json({
        success: true,
        data: {
          clientName: client.name,
          templateName: template.name,
          envContent: envContent,
        },
      });
    } catch (error) {
      console.error("Errore nella generazione del file .env:", error);
      res.status(500).json({
        success: false,
        error: "Errore interno del server",
      });
    }
  },

  /**
   * Esporta un file ZIP contenente i file .env per tutti i clienti di un template
   * POST /export-zip
   * Body: {templateId}
   */
  async exportZip(req, res) {
    try {
      const { templateId } = req.body;

      if (!templateId) {
        return res.status(400).json({
          success: false,
          error: "ID template è obbligatorio",
        });
      }

      // Recupera il template con le sue variabili
      const template = await Template.findByPk(templateId, {
        include: [
          {
            model: TemplateVariable,
            as: "variables",
            attributes: ["id", "key", "isCommon", "isRequired", "commonValue"],
          },
        ],
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          error: "Template non trovato",
        });
      }

      // Recupera tutti i clienti del template con le loro variabili
      const clients = await Client.findAll({
        where: { templateId },
        include: [
          {
            model: ClientVariable,
            as: "variables",
            attributes: ["templateVariableId", "value"],
          },
        ],
      });

      if (clients.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Nessun cliente trovato per questo template",
        });
      }

      // Configura la risposta per il download del file ZIP
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="env-files-${template.name.replace(
          /[^a-zA-Z0-9]/g,
          "_"
        )}.zip"`
      );

      // Crea l'archiver ZIP
      const archive = archiver("zip", {
        zlib: { level: 9 }, // Massima compressione
      });

      // Gestisce errori dell'archiver
      archive.on("error", (err) => {
        console.error("Errore nell'archiver:", err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: "Errore nella creazione del file ZIP",
          });
        }
      });

      // Pipe dell'archiver alla risposta
      archive.pipe(res);

      // Genera un file .env per ogni cliente
      for (const client of clients) {
        try {
          // Prepara la mappa dei valori delle variabili per questo cliente
          const variableValues = {};
          let hasErrors = false;

          // Processa ogni variabile del template
          for (const templateVar of template.variables) {
            if (templateVar.isCommon) {
              // Variabile comune: usa il valore dal template
              variableValues[templateVar.key] = templateVar.commonValue;
            } else {
              // Variabile non comune: cerca il valore nelle ClientVariable
              const clientVar = client.variables.find(
                (cv) => cv.templateVariableId === templateVar.id
              );

              if (clientVar && clientVar.value) {
                variableValues[templateVar.key] = clientVar.value;
              } else {
                // Nessun valore trovato
                if (templateVar.isRequired) {
                  // Per l'export ZIP, usa un placeholder per le variabili obbligatorie mancanti
                  variableValues[templateVar.key] = `{{${templateVar.key}}}`;
                  hasErrors = true;
                } else {
                  variableValues[templateVar.key] = "";
                }
              }
            }
          }

          // Genera il contenuto del file .env
          let envContent = template.variables
            .map(
              (variable) => `${variable.key}=${variableValues[variable.key]}`
            )
            .join("\n");

          // Se ci sono errori, aggiungi un commento in cima al file
          if (hasErrors) {
            envContent = `# ATTENZIONE: Alcune variabili obbligatorie non sono configurate per questo cliente\n# Configurare i valori mancanti prima dell'uso\n\n${envContent}`;
          }

          // Aggiunge il file all'archivio con nome {nomeCliente}.env
          const fileName = `${client.name.replace(/[^a-zA-Z0-9]/g, "_")}.env`;
          archive.append(envContent, { name: fileName });
        } catch (clientError) {
          console.error(
            `Errore nella generazione .env per cliente ${client.name}:`,
            clientError
          );
          // Continua con gli altri clienti
        }
      }

      // Finalizza l'archivio
      await archive.finalize();
    } catch (error) {
      console.error("Errore nell'export ZIP:", error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Errore interno del server",
        });
      }
    }
  },
};

module.exports = envController;
