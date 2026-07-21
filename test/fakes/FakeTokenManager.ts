import { Utente } from "../../src/entities/Utente";
import { ITokenManager } from "../../src/use_cases/ports";

export class FakeTokenManager implements ITokenManager {
  public generaToken(utente: Utente): string {
    return `token-per-${utente.id}`;
  }
}
