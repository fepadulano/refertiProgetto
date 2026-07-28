import { RuoloUtente } from "../entities/Utente";
import { AuditLog, TipoAzione } from "../entities/AuditLog";
import { ErroreAutorizzazione } from "./erroriDominio";
import { injectable, inject } from "tsyringe";
import {
  IUtenteRepository,
  IAuditLogRepository,
  IUuidGenerator,
  IGestoreTransazioni,
} from "./ports";

export interface DisabilitaMedicoInput {
  adminId: string; // dal token JWT
  medicoUtenteId: string;
  ipAddress: string;
}

@injectable()
export class DisabilitaMedicoUseCase {
  constructor(
    @inject("IUtenteRepository") private utenteRepo: IUtenteRepository,
    @inject("IAuditLogRepository") private auditLogRepo: IAuditLogRepository,
    @inject("IUuidGenerator") private uuidGenerator: IUuidGenerator,
    @inject("IGestoreTransazioni")
    private gestoreTransazioni: IGestoreTransazioni,
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

    const auditLog = new AuditLog(
      this.uuidGenerator.genera(),
      responsabile.id,
      TipoAzione.DISABILITAZIONE_MEDICO,
      input.ipAddress,
      null,
    );

    // Le due scritture avvengono insieme, o nessuna delle due (RNF2)
    await this.gestoreTransazioni.esegui(async (transazione) => {
      await this.utenteRepo.aggiorna(medico, transazione);
      await this.auditLogRepo.salva(auditLog, transazione);
    });
  }
}
