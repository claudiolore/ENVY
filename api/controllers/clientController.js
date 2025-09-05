/**
 * Controller per la gestione dei Clienti
 * Gestisce CRUD operations per i clienti
 */

const { Client, Template, ClientVariable } = require("../models");

const clientController = {
  /**
   * Lista tutti i clienti di un template specifico
   * POST /client/list
   * Body: {templateId}
   */
  async list(req, res) {
    try {
      const { templateId } = req.body;

      if (!templateId) {
        return res.status(400).json({
          success: false,
          error: "templateId è obbligatorio",
        });
      }

      // Verifica che il template esista
      const template = await Template.findByPk(templateId);
      if (!template) {
        return res.status(404).json({
          success: false,
          error: "Template non trovato",
        });
      }

      const clients = await Client.findAll({
        where: { templateId },
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: Template,
            as: "template",
            attributes: ["id", "name"],
          },
          {
            model: ClientVariable,
            as: "variables",
            attributes: ["id", "templateVariableId", "value"],
          },
        ],
      });

      res.json({
        success: true,
        data: clients,
      });
    } catch (error) {
      console.error("Errore nel recupero dei clienti:", error);
      res.status(500).json({
        success: false,
        error: "Errore interno del server",
      });
    }
  },

  /**
   * Crea un nuovo cliente per un template specifico
   * POST /client/create
   * Body: {templateId, name}
   */
  async create(req, res) {
    try {
      const { templateId, name } = req.body;

      if (!templateId || !name) {
        return res.status(400).json({
          success: false,
          error: "templateId e nome sono obbligatori",
        });
      }

      // Verifica che il template esista
      const template = await Template.findByPk(templateId);
      if (!template) {
        return res.status(404).json({
          success: false,
          error: "Template non trovato",
        });
      }

      const client = await Client.create({ templateId, name });

      // Ricarica il client con le relazioni per la risposta
      const clientWithTemplate = await Client.findByPk(client.id, {
        include: [
          {
            model: Template,
            as: "template",
            attributes: ["id", "name"],
          },
        ],
      });

      res.json({
        success: true,
        data: clientWithTemplate,
      });
    } catch (error) {
      console.error("Errore nella creazione del cliente:", error);

      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          success: false,
          error: "Un cliente con questo nome esiste già",
        });
      }

      res.status(500).json({
        success: false,
        error: "Errore interno del server",
      });
    }
  },

  /**
   * Aggiorna un cliente esistente
   * POST /client/update
   * Body: {id, name}
   */
  async update(req, res) {
    try {
      const { id, name } = req.body;

      if (!id || !name) {
        return res.status(400).json({
          success: false,
          error: "ID e nome sono obbligatori",
        });
      }

      const client = await Client.findByPk(id);
      if (!client) {
        return res.status(404).json({
          success: false,
          error: "Cliente non trovato",
        });
      }

      await client.update({ name });

      res.json({
        success: true,
        data: client,
      });
    } catch (error) {
      console.error("Errore nell'aggiornamento del cliente:", error);

      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          success: false,
          error: "Un cliente con questo nome esiste già",
        });
      }

      res.status(500).json({
        success: false,
        error: "Errore interno del server",
      });
    }
  },

  /**
   * Elimina un cliente
   * POST /client/delete
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

      const client = await Client.findByPk(id);
      if (!client) {
        return res.status(404).json({
          success: false,
          error: "Cliente non trovato",
        });
      }

      // Il CASCADE è definito nel modello, quindi le variabili verranno eliminate automaticamente
      await client.destroy();

      res.json({
        success: true,
        message: "Cliente eliminato con successo",
      });
    } catch (error) {
      console.error("Errore nell'eliminazione del cliente:", error);
      res.status(500).json({
        success: false,
        error: "Errore interno del server",
      });
    }
  },
};

module.exports = clientController;
