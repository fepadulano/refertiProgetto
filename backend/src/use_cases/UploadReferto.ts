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
  IGestoreTransazioni,
} from "./ports";

export interface UploadRefertoInput {
  utenteId: string; // dal token JWT
  pazienteId: string;
  percorsoFile: string;
  categoria: string;
  dataEsame: Date; // quando è stato fatto l'esame, non quando viene caricato
  ipAddress: string;
}

@injectable()
export class UploadRefertoUseCase {
  constructor(
    @inject("IUtenteRepository") private utenteRepo: IUtenteRepository,
    @inject("IRefertoRepository") private refertoRepo: IRefertoRepository,
    @inject("IAuditLogRepository") private auditLogRepo: IAuditLogRepository,
    @inject("IUuidGenerator") private uuidGenerator: IUuidGenerator,
    @inject("IGestoreTransazioni")
    private gestoreTransazioni: IGestoreTransazioni,
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

    const nuovoRefertoId = this.uuidGenerator.genera();
    const nuovoReferto = new Referto(
      nuovoRefertoId,
      utente.profiloMedico.id,
      input.pazienteId,
      input.percorsoFile,
      input.categoria.trim(),
      input.dataEsame,
    );

    const nuovoLogId = this.uuidGenerator.genera();
    const auditLog = new AuditLog(
      nuovoLogId,
      utente.id,
      TipoAzione.UPLOAD_REFERTO,
      input.ipAddress,
      nuovoReferto.id,
    );

    // Le due scritture avvengono insieme, o nessuna delle due (RNF2)
    await this.gestoreTransazioni.esegui(async (transazione) => {
      await this.refertoRepo.salva(nuovoReferto, transazione);
      await this.auditLogRepo.salva(auditLog, transazione);
    });

    return nuovoReferto;
  }
}
