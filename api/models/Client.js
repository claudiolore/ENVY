/**
 * Modello Client - Rappresenta un cliente
 * Ogni cliente può avere multiple variabili associate
 */

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Client = sequelize.define(
  "Client",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    templateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "templates",
        key: "id",
      },
      comment: "ID del template a cui appartiene il cliente",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  },
  {
    tableName: "clients",
    timestamps: true, // Aggiunge createdAt e updatedAt automaticamente
    indexes: [
      {
        fields: ["templateId"],
      },
    ],
  }
);

module.exports = Client;
