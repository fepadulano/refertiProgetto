import { DataTypes, Model } from "sequelize";
import { database } from "../database";

export class MedicoModel extends Model {
  declare id: string;
  declare utenteId: string;
  declare numeroMatricola: string;
  declare specializzazione: string;
}

MedicoModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    utenteId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "utenti",
        key: "id",
      },
    },
    numeroMatricola: { type: DataTypes.STRING, allowNull: false, unique: true },
    specializzazione: { type: DataTypes.STRING, allowNull: false },
  },
  {
    sequelize: database,
    modelName: "Medico",
    tableName: "medici",
    timestamps: true,
    updatedAt: false,
  },
);
