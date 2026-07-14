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

export interface DownloadRefertoInput {
  utenteId: string; // Chi sta chiedendo il file (dal token JWT)
  refertoId: string; // L'UUID del file richiesto
  ipAddress: string; // Per l'Audit Log
}

@injectable()
export class DownloadRefertoUseCase {
  constructor(
    @inject("IUtenteRepository") private utenteRepo: IUtenteRepository,
    @inject("IRefertoRepository") private refertoRepo: IRefertoRepository,
    @inject("IAuditLogRepository") private auditLogRepo: IAuditLogRepository,
    @inject("IUuidGenerator") private uuidGenerator: IUuidGenerator,
  ) {}

  // ritorna una stringa (il percorso fisico del file sul server) in modo che Express possa poi inviare il PDF
  public async execute(input: DownloadRefertoInput): Promise<string> {
    // 1. Cerchiamo chi fa la richiesta e cosa sta cercando
    const utente = await this.utenteRepo.findByIdConProfilo(input.utenteId);
    const referto = await this.refertoRepo.findById(input.refertoId);

    if (!utente) throw new Error("Utente non trovato");
    if (!referto) throw new Error("Referto non trovato");

    let autorizzato = false;

    if (utente.ruolo === RuoloUtente.MEDICO && utente.profiloMedico) {
      // È un medico: il SUO ID medico deve combaciare con il medico_id del referto
      autorizzato = utente.profiloMedico.id === referto.medicoId;
    } else if (
      utente.ruolo === RuoloUtente.PAZIENTE &&
      utente.profiloPaziente
    ) {
      // È un paziente: il SUO ID paziente deve combaciare con il paziente_id del referto
      autorizzato = utente.profiloPaziente.id === referto.pazienteId;
    }

    // 3. REGISTRAZIONE NELL'AUDIT LOG (GDPR)
    const nuovoLogId = this.uuidGenerator.genera();

    if (!autorizzato) {
      // Registriamo il tentativo illecito (o l'errore) e blocchiamo l'esecuzione
      const logViolazione = new AuditLog(
        nuovoLogId,
        utente.id,
        TipoAzione.ACCESSO_NEGATO,
        input.ipAddress,
        referto.id,
      );
      await this.auditLogRepo.salva(logViolazione);
      throw new ErroreAutorizzazione(
        "Accesso negato: non hai i permessi per visualizzare questo referto.",
      );
    }

    // Se arriviamo qui, l'utente è autorizzato. Registriamo il download legittimo.
    const logSuccesso = new AuditLog(
      nuovoLogId,
      utente.id,
      TipoAzione.DOWNLOAD_REFERTO,
      input.ipAddress,
      referto.id,
    );
    await this.auditLogRepo.salva(logSuccesso);

    // 4. Ritorniamo il percorso in modo che il controller possa spedire il file
    return referto.percorsoFile;
  }
}
