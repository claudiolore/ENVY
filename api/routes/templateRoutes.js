/**
 * Routes per la gestione dei Template
 * Tutte le routes utilizzano il metodo POST come richiesto
 */

const express = require("express");
const templateController = require("../controllers/templateController");

const router = express.Router();

// POST /template/list - Lista tutti i template
router.post("/list", templateController.list);

// POST /template/create - Crea un nuovo template
router.post("/create", templateController.create);

// POST /template/update - Aggiorna un template esistente
router.post("/update", templateController.update);

// POST /template/delete - Elimina un template
router.post("/delete", templateController.delete);

// POST /template/analyze-import - Analizza file .env multipli per l'importazione
router.post("/analyze-import", templateController.analyzeImport);

// POST /template/confirm-import - Conferma l'importazione e crea tutto
router.post("/confirm-import", templateController.confirmImport);

module.exports = router;
