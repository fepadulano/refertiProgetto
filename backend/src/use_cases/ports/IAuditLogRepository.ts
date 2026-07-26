import { AuditLog } from "../../entities/AuditLog";
import { Transazione } from "./IGestoreTransazioni";

export interface IAuditLogRepository {
  salva(log: AuditLog, transazione?: Transazione): Promise<void>;
}
