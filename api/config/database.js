/**
 * Configurazione del database SQLite con Sequelize
 * Gestisce la connessione e la sincronizzazione delle tabelle
 */

const { Sequelize } = require("sequelize");
const path = require("path");

// Configurazione della connessione SQLite
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../database.sqlite"),
  logging: false, // Disabilita i log SQL per un output più pulito
});

/**
 * Testa la connessione al database
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connessione al database SQLite stabilita con successo");
  } catch (error) {
    console.error("❌ Impossibile connettersi al database:", error);
    process.exit(1);
  }
}

/**
 * Sincronizza tutti i modelli con il database
 * Crea le tabelle se non esistono
 */
async function syncDatabase() {
  try {
    await sequelize.sync({ alter: true });
    console.log("✅ Database sincronizzato con successo");
  } catch (error) {
    console.error("❌ Errore nella sincronizzazione del database:", error);
    process.exit(1);
  }
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
};
