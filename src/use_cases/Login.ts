import { AuditLog, TipoAzione } from "../entities/AuditLog";
import { injectable, inject } from "tsyringe";
import {
  IUtenteRepository,
  IPasswordHasher,
  ITokenManager,
  IAuditLogRepository,
  IUuidGenerator,
} from "./ports";

export interface LoginInput {
  email: string;
  passwordInChiaro: string;
  ipAddress: string;
}

// Dopo questi tentativi falliti consecutivi, l'account viene bloccato
// temporaneamente (anche con password corretta) per questa finestra di tempo.
const MAX_TENTATIVI_FALLITI = 5;
const FINESTRA_BLOCCO_MINUTI = 15;

@injectable()
export class LoginUseCase {
  constructor(
    @inject("IUtenteRepository") private utenteRepo: IUtenteRepository,
    @inject("IPasswordHasher") private passwordHasher: IPasswordHasher,
    @inject("ITokenManager") private tokenManager: ITokenManager,
    @inject("IAuditLogRepository") private auditLogRepo: IAuditLogRepository,
    @inject("IUuidGenerator") private uuidGenerator: IUuidGenerator,
  ) {}

  public async execute(input: LoginInput): Promise<string> {
    const utente = await this.utenteRepo.findByEmail(input.email);
    if (!utente) {
      // Email sconosciuta: nessun utenteId disponibile per l'audit log
      // (utenteId è una chiave esterna obbligatoria verso la tabella utenti)
      throw new Error("Credenziali non valide");
    }

    const dopoData = new Date(
      Date.now() - FINESTRA_BLOCCO_MINUTI * 60 * 1000,
    );
    const tentativiRecenti = await this.auditLogRepo.contaTentativiFallitiRecenti(
      utente.id,
      dopoData,
    );
    if (tentativiRecenti >= MAX_TENTATIVI_FALLITI) {
      await this.registraAccessoNegato(utente.id, input.ipAddress);
      throw new Error(
        `Troppi tentativi falliti. Riprova tra ${FINESTRA_BLOCCO_MINUTI} minuti.`,
      );
    }

    if (!utente.attivo) {
      await this.registraTentativoFallito(utente.id, input.ipAddress);
      throw new Error("Questo account è stato disabilitato");
    }

    const passwordValida = await this.passwordHasher.compara(
      input.passwordInChiaro,
      utente.passwordHash,
    );
    if (!passwordValida) {
      await this.registraTentativoFallito(utente.id, input.ipAddress);
      throw new Error("Credenziali non valide");
    }

    const auditLog = new AuditLog(
      this.uuidGenerator.genera(),
      utente.id,
      TipoAzione.LOGIN_EFFETTUATO,
      input.ipAddress,
      null,
    );
    await this.auditLogRepo.salva(auditLog);

    return this.tokenManager.generaToken(utente);
  }

  private async registraTentativoFallito(
    utenteId: string,
    ipAddress: string,
  ): Promise<void> {
    const auditLog = new AuditLog(
      this.uuidGenerator.genera(),
      utenteId,
      TipoAzione.LOGIN_FALLITO,
      ipAddress,
      null,
    );
    await this.auditLogRepo.salva(auditLog);
  }

  private async registraAccessoNegato(
    utenteId: string,
    ipAddress: string,
  ): Promise<void> {
    const auditLog = new AuditLog(
      this.uuidGenerator.genera(),
      utenteId,
      TipoAzione.ACCESSO_NEGATO,
      ipAddress,
      null,
    );
    await this.auditLogRepo.salva(auditLog);
  }
}
