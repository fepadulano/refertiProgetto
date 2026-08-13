import { Utente } from "../entities/Utente";
import { AuditLog, TipoAzione } from "../entities/AuditLog";
import { injectable, inject } from "tsyringe";
import {
  IUtenteRepository,
  IPasswordHasher,
  IAuditLogRepository,
  IGeneratoreUuid,
  IGestoreTransazioni,
} from "./ports";

export interface CambiaPasswordInput {
  utenteId: string;
  passwordAttuale: string;
  nuovaPassword: string;
  ipAddress: string;
}

// Chiude il cerchio aperto da CreaMedicoUseCase e CreaPazienteUseCase: chi ha
// ricevuto un account con una password scelta da un Admin la sostituisce qui
// con una sua. Richiede comunque la password attuale, non solo quella nuova,
// così un token rubato da solo non basta a cambiare la password al posto
// del titolare.
@injectable()
export class CambiaPasswordUseCase {
  constructor(
    @inject("IUtenteRepository") private utenteRepo: IUtenteRepository,
    @inject("IPasswordHasher") private passwordHasher: IPasswordHasher,
    @inject("IAuditLogRepository") private auditLogRepo: IAuditLogRepository,
    @inject("IGeneratoreUuid") private uuidGenerator: IGeneratoreUuid,
    @inject("IGestoreTransazioni")
    private gestoreTransazioni: IGestoreTransazioni,
  ) {}

  public async execute(input: CambiaPasswordInput): Promise<Utente> {
    const utente = await this.utenteRepo.findById(input.utenteId);
    if (!utente) {
      throw new Error("Utente non trovato");
    }

    const passwordValida = await this.passwordHasher.compara(
      input.passwordAttuale,
      utente.passwordHash,
    );
    if (!passwordValida) {
      throw new Error("La password attuale non è corretta");
    }

    const nuovoHash = await this.passwordHasher.hash(input.nuovaPassword);
    utente.completaCambioPassword(nuovoHash);

    const auditLog = new AuditLog(
      this.uuidGenerator.genera(),
      utente.id,
      TipoAzione.CAMBIO_PASSWORD,
      input.ipAddress,
      null,
    );

    // Le due scritture avvengono insieme, o nessuna delle due (RNF2)
    await this.gestoreTransazioni.esegui(async (transazione) => {
      await this.utenteRepo.aggiorna(utente, transazione);
      await this.auditLogRepo.salva(auditLog, transazione);
    });

    return utente;
  }
}
