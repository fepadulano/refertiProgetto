import { DataTypes, Model } from "sequelize";
import { database } from "../database";

export class UtenteModel extends Model {
  declare id: string;
  declare nome: string;
  declare cognome: string;
  declare email: string;
  declare passwordHash: string;
  declare ruolo: string;
  declare attivo: boolean;
  declare deveCambiarePassword: boolean;
  declare createdAt: Date;
}

UtenteModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    nome: { type: DataTypes.STRING, allowNull: false },
    cognome: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    ruolo: { type: DataTypes.STRING, allowNull: false },
    attivo: { type: DataTypes.BOOLEAN, defaultValue: true },
    deveCambiarePassword: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize: database,
    modelName: "Utente",
    tableName: "utenti",
    timestamps: true,
    updatedAt: false,
  },
);
