/**
 * Controller per la gestione delle ClientVariable
 * Gestisce i valori specifici delle variabili per ogni cliente
 */

const {
  ClientVariable,
  Client,
  Template,
  TemplateVariable,
} = require("../models");

const clientVariableController = {
  /**
   * Lista le variabili di un cliente per un template specifico
   * POST /client-variable/list
   * Body: {clientId, templateId}
   */
  async list(req, res) {
    try {
      const { clientId, templateId } = req.body;

      if (!clientId || !templateId) {
        return res.status(400).json({
          success: false,
          error: "clientId e templateId sono obbligatori",
        });
      }

      // Verifica che il cliente esista e appartenga al template
      const client = await Client.findOne({
        where: { id: clientId, templateId },
        include: [
          {
            model: Template,
            as: "template",
            attributes: ["id", "name"],
          },
        ],
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          error: "Cliente non trovato o non appartiene al template",
        });
      }

      // Ottieni tutte le variabili del template che NON sono comuni
      // (solo quelle non comuni devono essere configurate per i clienti)
      const templateVariables = await TemplateVariable.findAll({
        where: {
          templateId,
          isCommon: false, // Solo variabili non comuni
        },
        attributes: ["id", "key", "isRequired"],
        order: [["key", "ASC"]],
      });

      // Ottieni i valori già configurati per questo cliente
      const clientVariables = await ClientVariable.findAll({
        where: { clientId },
        include: [
          {
            model: TemplateVariable,
            as: "templateVariable",
            where: { templateId },
            attributes: ["id", "key", "isRequired"],
          },
        ],
      });

      // Combina le informazioni: template variables con i valori del cliente
      const variablesWithValues = templateVariables.map((templateVar) => {
        const clientVar = clientVariables.find(
          (cv) => cv.templateVariableId === templateVar.id
        );

        return {
          templateVariableId: templateVar.id,
          key: templateVar.key,
          isRequired: templateVar.isRequired,
          value: clientVar ? clientVar.value : "",
          clientVariableId: clientVar ? clientVar.id : null,
        };
      });

      res.json({
        success: true,
        data: {
          client: client,
          variables: variablesWithValues,
        },
      });
    } catch (error) {
      console.error("Errore nel recupero delle variabili cliente:", error);
      res.status(500).json({
        success: false,
        error: "Errore interno del server",
      });
    }
  },

  /**
   * Crea o aggiorna una variabile del cliente
   * POST /client-variable/upsert
   * Body: {clientId, templateVariableId, value}
   */
  async upsert(req, res) {
    try {
      const { clientId, templateVariableId, value } = req.body;

      if (!clientId || !templateVariableId) {
        return res.status(400).json({
          success: false,
          error: "clientId e templateVariableId sono obbligatori",
        });
      }

      // Verifica che il cliente e la template variable esistano
      const client = await Client.findByPk(clientId);
      if (!client) {
        return res.status(404).json({
          success: false,
          error: "Cliente non trovato",
        });
      }

      const templateVariable = await TemplateVariable.findByPk(
        templateVariableId
      );
      if (!templateVariable) {
        return res.status(404).json({
          success: false,
          error: "Variabile template non trovata",
        });
      }

      // Verifica che il cliente appartenga al template della variabile
      if (client.templateId !== templateVariable.templateId) {
        return res.status(400).json({
          success: false,
          error: "Cliente non appartiene al template della variabile",
        });
      }

      // Verifica che la variabile non sia comune
      if (templateVariable.isCommon) {
        return res.status(400).json({
          success: false,
          error: "Non è possibile modificare variabili comuni",
        });
      }

      // Se value è vuoto, elimina la ClientVariable se esiste
      if (!value || value.trim() === "") {
        await ClientVariable.destroy({
          where: { clientId, templateVariableId },
        });

        return res.json({
          success: true,
          message: "Valore eliminato",
        });
      }

      // Crea o aggiorna la ClientVariable
      const [clientVariable, created] = await ClientVariable.upsert({
        clientId,
        templateVariableId,
        value: value.trim(),
      });

      res.json({
        success: true,
        data: clientVariable,
        message: created ? "Variabile creata" : "Variabile aggiornata",
      });
    } catch (error) {
      console.error("Errore nell'upsert della variabile cliente:", error);
      res.status(500).json({
        success: false,
        error: "Errore interno del server",
      });
    }
  },

  /**
   * Elimina una variabile del cliente
   * POST /client-variable/delete
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

      const clientVariable = await ClientVariable.findByPk(id);
      if (!clientVariable) {
        return res.status(404).json({
          success: false,
          error: "Variabile cliente non trovata",
        });
      }

      await clientVariable.destroy();

      res.json({
        success: true,
        message: "Variabile cliente eliminata con successo",
      });
    } catch (error) {
      console.error("Errore nell'eliminazione della variabile cliente:", error);
      res.status(500).json({
        success: false,
        error: "Errore interno del server",
      });
    }
  },
};

module.exports = clientVariableController;
