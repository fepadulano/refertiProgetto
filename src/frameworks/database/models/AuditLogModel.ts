import { DataTypes, Model } from "sequelize";
import { database } from "../database";

export class AuditLogModel extends Model {
  declare id: string;
  declare utenteId: string;
  declare tipoAzione: string;
  declare ipAddress: string;
  declare refertoId: string | null;
  declare timestamp: Date;
}

AuditLogModel.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    utenteId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "utenti",
        key: "id",
      },
    },
    tipoAzione: { type: DataTypes.STRING, allowNull: false },
    ipAddress: { type: DataTypes.STRING, allowNull: false },

    refertoId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "referti",
        key: "id",
      },
    },

    timestamp: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize: database,
    modelName: "AuditLog",
    tableName: "audit_logs",
    timestamps: false,
  },
);
