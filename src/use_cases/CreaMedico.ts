import { Utente, RuoloUtente } from "../entities/Utente";
import { Medico } from "../entities/Medico";
import { AuditLog, TipoAzione } from "../entities/AuditLog";
import { ErroreAutorizzazione } from "./erroriDominio";
import { injectable, inject } from "tsyringe";
import {
  IUtenteRepository,
  IMedicoRepository,
  IAuditLogRepository,
  IPasswordHasher,
  IUuidGenerator,
} from "./ports";

export interface CreaMedicoInput {
  adminId: string; // ID dell'amministratore che sta compiendo l'azione (per il Log)
  nome: string;
  cognome: string;
  email: string;
  passwordInChiaro: string;
  specializzazione: string;
  ipAddress: string;
  numeroMatricola: string;
}

@injectable()
export class CreaMedicoUseCase {
  constructor(
    @inject("IUtenteRepository") private utenteRepo: IUtenteRepository,
    @inject("IMedicoRepository") private medicoRepo: IMedicoRepository,
    @inject("IAuditLogRepository") private auditLogRepo: IAuditLogRepository,
    @inject("IPasswordHasher") private passwordHasher: IPasswordHasher,
    @inject("IUuidGenerator") private uuidGenerator: IUuidGenerator,
  ) {}

  public async execute(input: CreaMedicoInput): Promise<Utente> {
    // 1. Controllo autorizzazione: l'utente che crea deve esistere ed essere un ADMIN
    const responsabile = await this.utenteRepo.findById(input.adminId);
    if (!responsabile || responsabile.ruolo !== RuoloUtente.ADMIN) {
      throw new ErroreAutorizzazione(
        "Accesso negato: operazione consentita solo agli amministratori.",
      );
    }

    const emailGiaUsata = await this.utenteRepo.esisteEmail(input.email);
    if (emailGiaUsata) {
      throw new Error("Esiste già un account con questa email.");
    }

    const passwordHashata = await this.passwordHasher.hash(
      input.passwordInChiaro,
    );

    // 2. Creazione dell'Utente base (Forzando il ruolo MEDICO)
    const nuovoUtenteId = this.uuidGenerator.genera();
    const nuovoUtente = new Utente(
      nuovoUtenteId,
      input.nome,
      input.cognome,
      input.email,
      passwordHashata,
      RuoloUtente.MEDICO,
    );

    // 3. Creazione del profilo professionale Medico legato all'Utente
    const nuovoMedicoId = this.uuidGenerator.genera();
    const nuovoMedico = new Medico(
      nuovoMedicoId,
      nuovoUtente.id,
      input.specializzazione,
      input.numeroMatricola,
    );

    nuovoUtente.profiloMedico = nuovoMedico;

    // 4. Tracciamento dell'operazione nell'Audit Log (associato all'ID dell'admin che ha agito)
    const nuovoLogId = this.uuidGenerator.genera();
    const auditLog = new AuditLog(
      nuovoLogId,
      responsabile.id,
      TipoAzione.REGISTRAZIONE_UTENTE,
      input.ipAddress,
      null,
    );

    // Persistenza dei dati
    await this.utenteRepo.salva(nuovoUtente);
    await this.medicoRepo.salva(nuovoMedico);
    await this.auditLogRepo.salva(auditLog);

    return nuovoUtente;
  }
}
