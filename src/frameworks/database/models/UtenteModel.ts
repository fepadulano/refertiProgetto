import { DataTypes, Model } from "sequelize";
import { database } from "../database";

// Definiamo il Modello estendendo la classe Model di Sequelize
export class UtenteModel extends Model {
  declare id: string;
  declare nome: string;
  declare cognome: string;
  declare email: string;
  declare passwordHash: string;
  declare ruolo: string;
  declare attivo: boolean;
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
  },
  {
    sequelize: database, // Passiamo la connessione che abbiamo appena testato
    modelName: "Utente",
    tableName: "utenti",
    timestamps: true,
    updatedAt: false,
  },
);
