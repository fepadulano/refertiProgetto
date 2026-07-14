import { Referto } from "../entities/Referto";
import { AuditLog, TipoAzione } from "../entities/AuditLog";
import { RuoloUtente } from "../entities/Utente";
import { ErroreAutorizzazione } from "./erroriDominio";
import { injectable, inject } from "tsyringe";
import {
  IUtenteRepository,
  IRefertoRepository,
  IAuditLogRepository,
  IUuidGenerator,
} from "./ports";

export interface UploadRefertoInput {
  utenteId: string; // L'ID di chi sta facendo la richiesta (estratto dal token di sessione)
  pazienteId: string; // Il paziente a cui è destinato il referto
  percorsoFile: string; // Dove abbiamo salvato fisicamente il PDF sul server
  categoria: string; // Es. "Radiografia"
  ipAddress: string; // Per l'Audit Log
}

@injectable()
export class UploadRefertoUseCase {
  constructor(
    @inject("IUtenteRepository") private utenteRepo: IUtenteRepository,
    @inject("IRefertoRepository") private refertoRepo: IRefertoRepository,
    @inject("IAuditLogRepository") private auditLogRepo: IAuditLogRepository,
    @inject("IUuidGenerator") private uuidGenerator: IUuidGenerator,
  ) {}

  public async execute(input: UploadRefertoInput): Promise<Referto> {
    const utente = await this.utenteRepo.findByIdConProfilo(input.utenteId);

    if (!utente) {
      throw new Error("Utente non trovato");
    }

    if (utente.ruolo !== RuoloUtente.MEDICO || !utente.profiloMedico) {
      throw new ErroreAutorizzazione(
        "Accesso negato: solo i medici registrati possono caricare referti",
      );
    }

    // Creazione dell'Entità Referto
    const nuovoRefertoId = this.uuidGenerator.genera();
    const nuovoReferto = new Referto(
      nuovoRefertoId,
      utente.profiloMedico.id, // ID specifico del medico, non dell'utente generico
      input.pazienteId,
      input.percorsoFile,
      input.categoria,
    );

    // Tracciabilità GDPR (L'impronta digitale dell'azione)
    const nuovoLogId = this.uuidGenerator.genera();
    const auditLog = new AuditLog(
      nuovoLogId,
      utente.id, // Chi ha fatto l'azione? (ID account)
      TipoAzione.UPLOAD_REFERTO,
      input.ipAddress,
      nuovoReferto.id,
    );

    // Passo 4: Persistenza (Salvataggio tramite le porte)
    // In una fase successiva (livello Adapters) potremo avvolgere queste due chiamate
    // in una singola "Transazione SQL" per garantire che si salvino entrambe o nessuna delle due.
    await this.refertoRepo.salva(nuovoReferto);
    await this.auditLogRepo.salva(auditLog);

    return nuovoReferto;
  }
}
