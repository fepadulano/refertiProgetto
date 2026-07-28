import * as jwt from "jsonwebtoken";
import { Utente } from "../../entities/Utente";
import { ITokenManager } from "../../use_cases/ports";
import { JWT_SECRET, JWT_EXPIRES_IN } from "./jwtConfig";

export class JwtTokenManager implements ITokenManager {
  public generaToken(utente: Utente): string {
    // mai dati sensibili nel payload, es. la password hashata
    const payload = {
      id: utente.id,
      ruolo: utente.ruolo,
    };

    // il cast serve perché JWT_EXPIRES_IN arriva da .env come stringa generica
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
  }
}
