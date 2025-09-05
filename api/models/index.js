/**
 * Indice dei modelli - Definisce le relazioni tra i modelli e li esporta
 * Centralizza la gestione di tutti i modelli Sequelize
 */

const Template = require("./Template");
const TemplateVariable = require("./TemplateVariable");
const Client = require("./Client");
const ClientVariable = require("./ClientVariable");

// Definizione delle associazioni/relazioni

// Template <-> TemplateVariable (One-to-Many)
Template.hasMany(TemplateVariable, {
  foreignKey: "templateId",
  as: "variables",
  onDelete: "CASCADE", // Elimina tutte le variabili quando si elimina un template
});

TemplateVariable.belongsTo(Template, {
  foreignKey: "templateId",
  as: "template",
});

// Template <-> Client (One-to-Many)
Template.hasMany(Client, {
  foreignKey: "templateId",
  as: "clients",
  onDelete: "CASCADE", // Elimina tutti i clienti quando si elimina un template
});

Client.belongsTo(Template, {
  foreignKey: "templateId",
  as: "template",
});

// Client <-> ClientVariable (One-to-Many)
Client.hasMany(ClientVariable, {
  foreignKey: "clientId",
  as: "variables",
  onDelete: "CASCADE", // Elimina tutte le variabili quando si elimina un cliente
});

ClientVariable.belongsTo(Client, {
  foreignKey: "clientId",
  as: "client",
});

// TemplateVariable <-> ClientVariable (One-to-Many)
TemplateVariable.hasMany(ClientVariable, {
  foreignKey: "templateVariableId",
  as: "clientValues",
  onDelete: "CASCADE", // Elimina tutti i valori client quando si elimina una template variable
});

ClientVariable.belongsTo(TemplateVariable, {
  foreignKey: "templateVariableId",
  as: "templateVariable",
});

// Esportazione di tutti i modelli
module.exports = {
  Template,
  TemplateVariable,
  Client,
  ClientVariable,
  // Esporto anche sequelize per operazioni di database
  sequelize: require("../config/database").sequelize,
};
