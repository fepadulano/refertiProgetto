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
  IGestoreTransazioni,
} from "./ports";

export interface CreaMedicoInput {
  adminId: string; // chi compie l'azione (per il log)
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
    @inject("IGestoreTransazioni")
    private gestoreTransazioni: IGestoreTransazioni,
  ) {}

  public async execute(input: CreaMedicoInput): Promise<Utente> {
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

    const nuovoUtenteId = this.uuidGenerator.genera();
    const nuovoUtente = new Utente(
      nuovoUtenteId,
      input.nome,
      input.cognome,
      input.email,
      passwordHashata,
      RuoloUtente.MEDICO,
    );

    const nuovoMedicoId = this.uuidGenerator.genera();
    const nuovoMedico = new Medico(
      nuovoMedicoId,
      nuovoUtente.id,
      input.specializzazione,
      input.numeroMatricola,
    );

    nuovoUtente.profiloMedico = nuovoMedico;

    const nuovoLogId = this.uuidGenerator.genera();
    const auditLog = new AuditLog(
      nuovoLogId,
      responsabile.id,
      TipoAzione.REGISTRAZIONE_UTENTE,
      input.ipAddress,
      null,
    );

    // Le tre scritture avvengono insieme, o nessuna delle tre (RNF2)
    await this.gestoreTransazioni.esegui(async (transazione) => {
      await this.utenteRepo.salva(nuovoUtente, transazione);
      await this.medicoRepo.salva(nuovoMedico, transazione);
      await this.auditLogRepo.salva(auditLog, transazione);
    });

    return nuovoUtente;
  }
}
