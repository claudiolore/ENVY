/**
 * Modello TemplateVariable - Rappresenta una variabile di un template
 * Ogni variabile può essere comune (stesso valore per tutti i clienti) o specifica per cliente
 */

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const TemplateVariable = sequelize.define(
  "TemplateVariable",
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
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    isCommon: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Se true, la variabile ha lo stesso valore per tutti i clienti",
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Se true, la variabile deve avere un valore per la generazione",
    },
    commonValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Valore comune per tutti i clienti (solo se isCommon=true)",
    },
  },
  {
    tableName: "template_variables",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["templateId", "key"],
      },
    ],
  }
);

module.exports = TemplateVariable;
