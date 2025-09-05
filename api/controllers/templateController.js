/**
 * Controller per la gestione dei Template
 * Gestisce CRUD operations per i template di file .env
 */

const { Template, TemplateVariable } = require("../models");

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
        ],
        order: [["createdAt", "DESC"]],
      });

      res.json({
        success: true,
        data: templates,
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

      // Crea il template
      const template = await Template.create({ name }, { transaction });

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

      // Aggiorna il template
      await template.update({ name }, { transaction });

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
};

module.exports = templateController;
