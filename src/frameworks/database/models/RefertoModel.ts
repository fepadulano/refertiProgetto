import { DataTypes, Model } from "sequelize";
import { database } from "../database";

export class RefertoModel extends Model {
  declare id: string;
  declare medicoId: string;
  declare pazienteId: string;
  declare percorsoFile: string;
  declare categoria: string;
  declare dataCaricamento: Date;
}

RefertoModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    medicoId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "medici", // Punta alla tabella fisica dei medici
        key: "id",
      },
    },
    pazienteId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "pazienti", // Punta alla tabella fisica dei pazienti
        key: "id",
      },
    },
    percorsoFile: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    categoria: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dataCaricamento: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize: database,
    modelName: "Referto",
    tableName: "referti",
    timestamps: false, // Disabilitato perché gestiamo la data tramite "dataCaricamento" dell'entità
  },
);
