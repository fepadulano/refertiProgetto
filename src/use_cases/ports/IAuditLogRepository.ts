import { AuditLog } from "../../entities/AuditLog";

export interface IAuditLogRepository {
  salva(log: AuditLog): Promise<void>;
}
