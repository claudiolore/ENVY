/**
 * Routes per la gestione dei Clienti
 * Tutte le routes utilizzano il metodo POST come richiesto
 */

const express = require("express");
const clientController = require("../controllers/clientController");

const router = express.Router();

// POST /client/list - Lista tutti i clienti
router.post("/list", clientController.list);

// POST /client/create - Crea un nuovo cliente
router.post("/create", clientController.create);

// POST /client/update - Aggiorna un cliente esistente
router.post("/update", clientController.update);

// POST /client/delete - Elimina un cliente
router.post("/delete", clientController.delete);

module.exports = router;
