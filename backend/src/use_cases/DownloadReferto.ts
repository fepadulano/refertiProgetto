import { AuditLog, TipoAzione } from "../entities/AuditLog";
import { RuoloUtente } from "../entities/Utente";
import { ErroreAutorizzazione } from "./erroriDominio";
import { injectable, inject } from "tsyringe";
import {
  IUtenteRepository,
  IRefertoRepository,
  IAuditLogRepository,
  IGeneratoreUuid,
} from "./ports";

export interface DownloadRefertoInput {
  utenteId: string; // dal token JWT
  refertoId: string;
  ipAddress: string;
}

@injectable()
export class DownloadRefertoUseCase {
  constructor(
    @inject("IUtenteRepository") private utenteRepo: IUtenteRepository,
    @inject("IRefertoRepository") private refertoRepo: IRefertoRepository,
    @inject("IAuditLogRepository") private auditLogRepo: IAuditLogRepository,
    @inject("IGeneratoreUuid") private uuidGenerator: IGeneratoreUuid,
  ) {}

  // ritorna il percorso fisico del file, così il controller può inviarlo
  public async execute(input: DownloadRefertoInput): Promise<string> {
    const utente = await this.utenteRepo.findByIdConProfilo(input.utenteId);
    const referto = await this.refertoRepo.findById(input.refertoId);

    if (!utente) throw new Error("Utente non trovato");
    if (!referto) throw new Error("Referto non trovato");

    let autorizzato = false;

    if (utente.ruolo === RuoloUtente.MEDICO && utente.profiloMedico) {
      autorizzato = utente.profiloMedico.id === referto.medicoId;
    } else if (
      utente.ruolo === RuoloUtente.PAZIENTE &&
      utente.profiloPaziente
    ) {
      autorizzato = utente.profiloPaziente.id === referto.pazienteId;
    }

    const nuovoLogId = this.uuidGenerator.genera();

    if (!autorizzato) {
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

    const logSuccesso = new AuditLog(
      nuovoLogId,
      utente.id,
      TipoAzione.DOWNLOAD_REFERTO,
      input.ipAddress,
      referto.id,
    );
    await this.auditLogRepo.salva(logSuccesso);

    return referto.percorsoFile;
  }
}
