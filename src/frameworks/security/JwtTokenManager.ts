import * as jwt from "jsonwebtoken";
import { Utente } from "../../entities/Utente";
import { ITokenManager } from "../../use_cases/ports";
import { JWT_SECRET, JWT_EXPIRES_IN } from "./jwtConfig";

export class JwtTokenManager implements ITokenManager {
  public generaToken(utente: Utente): string {
    // Prepariamo le informazioni minime da inserire nel token.
    // NON inseriamo mai dati sensibili come la password hashata.
    const payload = {
      id: utente.id,
      ruolo: utente.ruolo,
    };

    // Firmiamo il token con la nostra chiave segreta
    // (il cast serve perché JWT_EXPIRES_IN arriva da .env come stringa generica,
    // mentre jsonwebtoken si aspetta un formato letterale tipo "2h")
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
  }
}
