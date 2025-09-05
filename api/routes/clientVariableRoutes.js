/**
 * Routes per la gestione delle ClientVariable
 * Definisce gli endpoint per gestire i valori delle variabili per ogni cliente
 */

const express = require("express");
const router = express.Router();
const clientVariableController = require("../controllers/clientVariableController");

// Lista le variabili non comuni di un template per un cliente specifico
router.post("/list", clientVariableController.list);

// Crea o aggiorna una variabile del cliente
router.post("/upsert", clientVariableController.upsert);

// Elimina una variabile del cliente
router.post("/delete", clientVariableController.delete);

module.exports = router;
