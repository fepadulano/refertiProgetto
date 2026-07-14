import { RuoloUtente } from "../entities/Utente";
import { AuditLog, TipoAzione } from "../entities/AuditLog";
import { ErroreAutorizzazione } from "./erroriDominio";
import { injectable, inject } from "tsyringe";
import {
  IUtenteRepository,
  IAuditLogRepository,
  IUuidGenerator,
} from "./ports";

export interface DisabilitaMedicoInput {
  adminId: string; // Chi compie l'azione (dal token JWT)
  medicoUtenteId: string; // ID Utente del medico da disabilitare
  ipAddress: string;
}

@injectable()
export class DisabilitaMedicoUseCase {
  constructor(
    @inject("IUtenteRepository") private utenteRepo: IUtenteRepository,
    @inject("IAuditLogRepository") private auditLogRepo: IAuditLogRepository,
    @inject("IUuidGenerator") private uuidGenerator: IUuidGenerator,
  ) {}

  public async execute(input: DisabilitaMedicoInput): Promise<void> {
    const responsabile = await this.utenteRepo.findById(input.adminId);
    if (!responsabile || responsabile.ruolo !== RuoloUtente.ADMIN) {
      throw new ErroreAutorizzazione(
        "Accesso negato: operazione consentita solo agli amministratori.",
      );
    }

    const medico = await this.utenteRepo.findById(input.medicoUtenteId);
    if (!medico || medico.ruolo !== RuoloUtente.MEDICO) {
      throw new Error("Nessun account medico trovato con questo ID.");
    }

    medico.disabilitaAccount();
    await this.utenteRepo.aggiorna(medico);

    const auditLog = new AuditLog(
      this.uuidGenerator.genera(),
      responsabile.id,
      TipoAzione.DISABILITAZIONE_MEDICO,
      input.ipAddress,
      null,
    );
    await this.auditLogRepo.salva(auditLog);
  }
}
