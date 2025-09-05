/**
 * Server principale dell'applicazione ENVY Backend
 * Configura Express, CORS, routes e inizializza il database SQLite
 */

const express = require("express");
const cors = require("cors");
const { testConnection, syncDatabase } = require("./config/database");

// Import delle routes
const templateRoutes = require("./routes/templateRoutes");
const clientRoutes = require("./routes/clientRoutes");
const clientVariableRoutes = require("./routes/clientVariableRoutes");
const envRoutes = require("./routes/envRoutes");

// Configurazione del server
const PORT = process.env.PORT || 3001;
const app = express();

/**
 * Middleware di configurazione
 */
// CORS - permette le chiamate dal frontend
app.use(
  cors({
    origin: "*", // Per tool interno, accetta tutte le origini
    methods: ["POST"], // Solo POST come richiesto
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parser per JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/**
 * Mounting delle routes
 * Tutte le API usano il prefisso appropriato e solo metodi POST
 */
app.use("/template", templateRoutes);
app.use("/client", clientRoutes);
app.use("/client-variable", clientVariableRoutes);
app.use("/", envRoutes); // generate-env e export-zip sono in root

/**
 * Route di health check
 */
app.post("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server ENVY Backend attivo",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Middleware per gestione errori 404
 */
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error:
      "Endpoint non trovato. Ricorda che tutte le API utilizzano il metodo POST.",
    availableEndpoints: [
      "POST /template/list",
      "POST /template/create",
      "POST /template/update",
      "POST /template/delete",
      "POST /client/list",
      "POST /client/create",
      "POST /client/update",
      "POST /client/delete",
      "POST /client-variable/list",
      "POST /client-variable/upsert",
      "POST /client-variable/delete",
      "POST /generate-env",
      "POST /export-zip",
      "POST /health",
    ],
  });
});

/**
 * Middleware per gestione errori globali
 */
app.use((err, req, res, next) => {
  console.error("Errore non gestito:", err);

  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      error: "Errore interno del server",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

/**
 * Avvio del server
 */
async function startServer() {
  try {
    console.log("🚀 Avvio del server ENVY Backend...");

    // Test e sincronizzazione database
    await testConnection();
    await syncDatabase();

    // Avvio del server HTTP
    app.listen(PORT, () => {
      console.log(`🌟 Server avviato con successo!`);
      console.log(`📡 Server in ascolto su http://localhost:${PORT}`);
      console.log(`🗄️  Database SQLite configurato`);
      console.log(`📝 Endpoint disponibili:`);
      console.log(
        `   POST /template/* - Gestione template con variabili tipizzate`
      );
      console.log(`   POST /client/* - Gestione clienti per template`);
      console.log(
        `   POST /client-variable/* - Gestione variabili specifiche client`
      );
      console.log(`   POST /generate-env - Generazione .env con validazione`);
      console.log(`   POST /export-zip - Export ZIP per template`);
      console.log(`   POST /health - Health check`);
      console.log("");
      console.log("✅ Backend pronto per ricevere richieste!");
    });
  } catch (error) {
    console.error("❌ Errore nell'avvio del server:", error);
    process.exit(1);
  }
}

// Gestione graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Arresto del server in corso...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Arresto del server in corso...");
  process.exit(0);
});

// Avvio del server
startServer();

module.exports = app;
