/**
 * Modello ClientVariable - Rappresenta il valore di una variabile per uno specifico cliente
 * Esiste solo per le variabili che non sono comuni (isCommon=false)
 */

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ClientVariable = sequelize.define(
  "ClientVariable",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "clients",
        key: "id",
      },
    },
    templateVariableId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "template_variables",
        key: "id",
      },
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  },
  {
    tableName: "client_variables",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["clientId", "templateVariableId"],
      },
    ],
  }
);

module.exports = ClientVariable;
