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

module.exports = router;
