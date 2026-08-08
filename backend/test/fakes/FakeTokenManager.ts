import { Utente } from "../../src/entities/Utente";
import { ITokenManager } from "../../src/use_cases/ports";

export class FakeTokenManager implements ITokenManager {
  public generaToken(utente: Utente): string {
    return `token-per-${utente.id}`;
  }

  public generaRefreshToken(utente: Utente): string {
    return `refresh-per-${utente.id}`;
  }

  public verificaRefreshToken(refreshToken: string): { id: string } | null {
    const match = refreshToken.match(/^refresh-per-(.+)$/);
    return match ? { id: match[1] } : null;
  }
}
