import { AuditLog } from "../../entities/AuditLog";
import { Transazione } from "./IGestoreTransazioni";

export interface IAuditLogRepository {
  salva(log: AuditLog, transazione?: Transazione): Promise<void>;

  // Conta i LOGIN_FALLITO di un utente registrati dopo una certa data:
  // usato da LoginUseCase per bloccare temporaneamente un account dopo
  // troppi tentativi falliti consecutivi.
  contaTentativiFallitiRecenti(utenteId: string, dopo: Date): Promise<number>;
}
