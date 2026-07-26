import { Transaction } from "sequelize";
import { AuditLog } from "../../entities/AuditLog";
import { AuditLogModel } from "../../frameworks/database/models/AuditLogModel";
import { IAuditLogRepository, Transazione } from "../../use_cases/ports";

export class AuditLogRepository implements IAuditLogRepository {
  public async salva(log: AuditLog, transazione?: Transazione): Promise<void> {
    await AuditLogModel.create(
      {
        id: log.id,
        utenteId: log.utenteId,
        tipoAzione: log.tipoAzione,
        ipAddress: log.ipAddress,
        refertoId: log.refertoId,
        timestamp: log.timestamp,
      },
      { transaction: transazione as Transaction | undefined },
    );
  }
}
