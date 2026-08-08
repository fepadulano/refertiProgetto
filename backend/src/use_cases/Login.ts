import { AuditLog, TipoAzione } from "../entities/AuditLog";
import { injectable, inject } from "tsyringe";
import {
  IUtenteRepository,
  IPasswordHasher,
  ITokenManager,
  IAuditLogRepository,
  IGeneratoreUuid,
} from "./ports";

export interface LoginInput {
  email: string;
  passwordInChiaro: string;
  ipAddress: string;
}

export interface LoginOutput {
  token: string;
  refreshToken: string;
}

@injectable()
export class LoginUseCase {
  constructor(
    @inject("IUtenteRepository") private utenteRepo: IUtenteRepository,
    @inject("IPasswordHasher") private passwordHasher: IPasswordHasher,
    @inject("ITokenManager") private tokenManager: ITokenManager,
    @inject("IAuditLogRepository") private auditLogRepo: IAuditLogRepository,
    @inject("IGeneratoreUuid") private uuidGenerator: IGeneratoreUuid,
  ) {}

  public async execute(input: LoginInput): Promise<LoginOutput> {
    const utente = await this.utenteRepo.findByEmail(input.email);
    if (!utente) {
      // email sconosciuta: niente utenteId da loggare
      throw new Error("Credenziali non valide");
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

    return {
      token: this.tokenManager.generaToken(utente),
      refreshToken: this.tokenManager.generaRefreshToken(utente),
    };
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
}
