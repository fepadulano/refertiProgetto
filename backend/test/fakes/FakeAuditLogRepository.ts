import { AuditLog, TipoAzione } from "../../src/entities/AuditLog";
import { IAuditLogRepository } from "../../src/use_cases/ports";

export class FakeAuditLogRepository implements IAuditLogRepository {
  public logs: AuditLog[] = [];

  public async salva(log: AuditLog): Promise<void> {
    this.logs.push(log);
  }

  public async contaTentativiFallitiRecenti(
    utenteId: string,
    dopo: Date,
  ): Promise<number> {
    return this.logs.filter(
      (log) =>
        log.utenteId === utenteId &&
        log.tipoAzione === TipoAzione.LOGIN_FALLITO &&
        log.timestamp >= dopo,
    ).length;
  }
}
