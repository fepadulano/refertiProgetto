import { Utente, RuoloUtente } from "../entities/Utente";
import { Paziente } from "../entities/Paziente";
import { AuditLog, TipoAzione } from "../entities/AuditLog";
import { ErroreAutorizzazione } from "./erroriDominio";
import { injectable, inject } from "tsyringe";
import {
  IUtenteRepository,
  IPazienteRepository,
  IAuditLogRepository,
  IPasswordHasher,
  IGeneratoreUuid,
  IGestoreTransazioni,
} from "./ports";

export interface CreaPazienteInput {
  adminId: string; // chi compie l'azione (per il log e per l'autorizzazione)
  nome: string;
  cognome: string;
  email: string;
  passwordInChiaro: string;
  codiceFiscale: string;
  dataNascita: Date;
  ipAddress: string;
}

// RF9: l'account Paziente non viene autoregistrato, ma creato dalla segreteria
// (l'Amministratore, nel modello a tre ruoli di questo sistema) dopo aver
// verificato di persona l'identità e il codice fiscale del paziente — in
// Italia il CF non è un segreto: farlo dichiarare liberamente dall'utente
// permetterebbe di impersonare un paziente reale ancora prima che si registri.
// La stessa separazione tra front-office amministrativo e personale clinico
// vale anche nella realtà: la registrazione anagrafica è compito della
// segreteria/accettazione, non del medico, il cui tempo resta clinico.
@injectable()
export class CreaPazienteUseCase {
  constructor(
    @inject("IUtenteRepository") private utenteRepo: IUtenteRepository,
    @inject("IPazienteRepository") private pazienteRepo: IPazienteRepository,
    @inject("IAuditLogRepository") private auditLogRepo: IAuditLogRepository,
    @inject("IPasswordHasher") private passwordHasher: IPasswordHasher,
    @inject("IGeneratoreUuid") private uuidGenerator: IGeneratoreUuid,
    @inject("IGestoreTransazioni")
    private gestoreTransazioni: IGestoreTransazioni,
  ) {}

  public async execute(input: CreaPazienteInput): Promise<Utente> {
    const responsabile = await this.utenteRepo.findById(input.adminId);
    if (!responsabile || responsabile.ruolo !== RuoloUtente.ADMIN) {
      throw new ErroreAutorizzazione(
        "Accesso negato: operazione consentita solo agli amministratori.",
      );
    }

    // normalizzata in minuscolo, altrimenti "Mario@Test.it" e "mario@test.it"
    // verrebbero trattate come due email diverse (il confronto in Postgres è
    // case-sensitive) e passerebbero entrambe il controllo di unicità
    const email = input.email.trim().toLowerCase();

    const emailGiaUsata = await this.utenteRepo.esisteEmail(email);
    if (emailGiaUsata) {
      throw new Error("Esiste già un account con questa email.");
    }

    const passwordHashata = await this.passwordHasher.hash(
      input.passwordInChiaro,
    );

    const nuovoUtenteId = this.uuidGenerator.genera();
    // deveCambiarePassword=true: la password è provvisoria, scelta
    // dall'Admin, e il paziente dovrà sostituirla (Sezione 4.1.10)
    const nuovoUtente = new Utente(
      nuovoUtenteId,
      input.nome,
      input.cognome,
      email,
      passwordHashata,
      RuoloUtente.PAZIENTE,
      true,
    );

    const nuovoPazienteId = this.uuidGenerator.genera();
    // normalizzato in maiuscolo, altrimenti un medico che cerca il CF in
    // maiuscolo non troverebbe un paziente registrato in minuscolo
    const nuovoPaziente = new Paziente(
      nuovoPazienteId,
      nuovoUtente.id,
      input.codiceFiscale.trim().toUpperCase(),
      input.dataNascita,
    );

    nuovoUtente.profiloPaziente = nuovoPaziente;

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
      await this.pazienteRepo.salva(nuovoPaziente, transazione);
      await this.auditLogRepo.salva(auditLog, transazione);
    });

    return nuovoUtente;
  }
}
