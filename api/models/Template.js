/**
 * Modello Template - Rappresenta un template per file .env
 * Contiene il nome del template e il suo contenuto con placeholders
 */

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Template = sequelize.define(
  "Template",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  },
  {
    tableName: "templates",
    timestamps: true, // Aggiunge createdAt e updatedAt automaticamente
  }
);

module.exports = Template;
