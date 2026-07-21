import { Utente, RuoloUtente } from "../entities/Utente";
import { Paziente } from "../entities/Paziente";
import { AuditLog, TipoAzione } from "../entities/AuditLog";
import { injectable, inject } from "tsyringe";
import {
  IUtenteRepository,
  IPazienteRepository,
  IAuditLogRepository,
  IPasswordHasher,
  IUuidGenerator,
  IGestoreTransazioni,
} from "./ports";

export interface RegistrazionePazienteInput {
  nome: string;
  cognome: string;
  email: string;
  passwordInChiaro: string;
  codiceFiscale: string;
  dataNascita: Date;
  ipAddress: string;
}

@injectable()
export class RegistrazionePazienteUseCase {
  constructor(
    @inject("IUtenteRepository") private utenteRepo: IUtenteRepository,
    @inject("IPazienteRepository") private pazienteRepo: IPazienteRepository,
    @inject("IAuditLogRepository") private auditLogRepo: IAuditLogRepository,
    @inject("IPasswordHasher") private passwordHasher: IPasswordHasher,
    @inject("IUuidGenerator") private uuidGenerator: IUuidGenerator,
    @inject("IGestoreTransazioni")
    private gestoreTransazioni: IGestoreTransazioni,
  ) {}

  public async execute(input: RegistrazionePazienteInput): Promise<Utente> {
    const emailGiaUsata = await this.utenteRepo.esisteEmail(input.email);
    if (emailGiaUsata) {
      throw new Error("Esiste già un account con questa email.");
    }

    const passwordHashata = await this.passwordHasher.hash(
      input.passwordInChiaro,
    );

    // 1. Creazione dell'Utente base (Forzando il ruolo PAZIENTE)
    const nuovoUtenteId = this.uuidGenerator.genera();
    const nuovoUtente = new Utente(
      nuovoUtenteId,
      input.nome,
      input.cognome,
      input.email,
      passwordHashata,
      RuoloUtente.PAZIENTE,
    );

    // 2. Creazione del profilo clinico Paziente legato all'Utente
    const nuovoPazienteId = this.uuidGenerator.genera();
    // Normalizzato in maiuscolo (convenzione del CF italiano): senza questo,
    // un paziente scritto minuscolo in fase di registrazione non verrebbe
    // più trovato da un medico che lo cerca in maiuscolo.
    const nuovoPaziente = new Paziente(
      nuovoPazienteId,
      nuovoUtente.id,
      input.codiceFiscale.trim().toUpperCase(),
      input.dataNascita,
    );

    nuovoUtente.profiloPaziente = nuovoPaziente;

    // 3. Tracciamento dell'operazione nell'Audit Log
    const nuovoLogId = this.uuidGenerator.genera();
    const auditLog = new AuditLog(
      nuovoLogId,
      nuovoUtente.id,
      TipoAzione.REGISTRAZIONE_UTENTE,
      input.ipAddress,
      null,
    );

    // Persistenza dei dati: le tre scritture avvengono tutte insieme,
    // o nessuna delle tre (RNF2 - integrità e affidabilità dei dati)
    await this.gestoreTransazioni.esegui(async (transazione) => {
      await this.utenteRepo.salva(nuovoUtente, transazione);
      await this.pazienteRepo.salva(nuovoPaziente, transazione);
      await this.auditLogRepo.salva(auditLog, transazione);
    });

    return nuovoUtente;
  }
}
