import { injectable, inject } from "tsyringe";
import { IUtenteRepository, ITokenManager } from "./ports";

export interface RefreshTokenInput {
  refreshToken: string;
}

@injectable()
export class RefreshTokenUseCase {
  constructor(
    @inject("IUtenteRepository") private utenteRepo: IUtenteRepository,
    @inject("ITokenManager") private tokenManager: ITokenManager,
  ) {}

  public async execute(input: RefreshTokenInput): Promise<string> {
    const decodificato = this.tokenManager.verificaRefreshToken(
      input.refreshToken,
    );
    if (!decodificato) {
      throw new Error("Refresh token non valido o scaduto");
    }

    // ricontrolliamo l'utente sul database, non ci fidiamo solo del token:
    // un account disabilitato dopo l'emissione del refresh token non deve
    // poter continuare a ottenere nuovi access token
    const utente = await this.utenteRepo.findById(decodificato.id);
    if (!utente || !utente.attivo) {
      throw new Error("Refresh token non valido o scaduto");
    }

    return this.tokenManager.generaToken(utente);
  }
}
