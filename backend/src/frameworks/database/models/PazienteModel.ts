import { DataTypes, Model } from "sequelize";
import { database } from "../database";

export class PazienteModel extends Model {
  declare id: string;
  declare utenteId: string;
  declare codiceFiscale: string;
  declare dataNascita: Date;
}

PazienteModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    utenteId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: "utenti",
        key: "id",
      },
    },
    codiceFiscale: { type: DataTypes.STRING, allowNull: false, unique: true },
    dataNascita: { type: DataTypes.DATEONLY, allowNull: false },
  },
  {
    sequelize: database,
    modelName: "Paziente",
    tableName: "pazienti",
    timestamps: true,
    updatedAt: false,
  },
);
