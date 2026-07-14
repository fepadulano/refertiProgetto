import { AuditLog } from "../../entities/AuditLog";
import { AuditLogModel } from "../../frameworks/database/models/AuditLogModel";
import { IAuditLogRepository } from "../../use_cases/ports";

export class AuditLogRepository implements IAuditLogRepository {
  public async salva(log: AuditLog): Promise<void> {
    await AuditLogModel.create({
      id: log.id,
      utenteId: log.utenteId,
      tipoAzione: log.tipoAzione,
      ipAddress: log.ipAddress,
      refertoId: log.refertoId,
      timestamp: log.timestamp,
    });
  }
}
