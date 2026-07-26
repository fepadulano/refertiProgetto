import { AuditLog } from "../../src/entities/AuditLog";
import { IAuditLogRepository } from "../../src/use_cases/ports";

export class FakeAuditLogRepository implements IAuditLogRepository {
  public logs: AuditLog[] = [];

  public async salva(log: AuditLog): Promise<void> {
    this.logs.push(log);
  }
}
