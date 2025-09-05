/**
 * Routes per la generazione e export di file .env
 * Tutte le routes utilizzano il metodo POST come richiesto
 */

const express = require("express");
const envController = require("../controllers/envController");

const router = express.Router();

// POST /generate-env - Genera un singolo file .env per un cliente
router.post("/generate-env", envController.generateEnv);

// POST /export-zip - Esporta tutti i file .env in un archivio ZIP
router.post("/export-zip", envController.exportZip);

module.exports = router;
