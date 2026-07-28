import { DataTypes, Model } from "sequelize";
import { database } from "../database";

export class RefertoModel extends Model {
  declare id: string;
  declare medicoId: string;
  declare pazienteId: string;
  declare percorsoFile: string;
  declare categoria: string;
  declare dataEsame: Date;
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
        model: "medici",
        key: "id",
      },
    },
    pazienteId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "pazienti",
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
    dataEsame: {
      type: DataTypes.DATE,
      allowNull: false,
      // il default serve solo alla migrazione, un nuovo referto passa sempre un valore esplicito
      defaultValue: DataTypes.NOW,
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
    timestamps: false, // la data è gestita da "dataCaricamento" dell'entità
  },
);
