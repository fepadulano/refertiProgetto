import * as jwt from "jsonwebtoken";
import { Utente } from "../../entities/Utente";
import { ITokenManager } from "../../use_cases/ports";
import {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,
} from "./jwtConfig";

export class JwtTokenManager implements ITokenManager {
  public generaToken(utente: Utente): string {
    // mai dati sensibili nel payload, es. la password hashata
    const payload = {
      id: utente.id,
      ruolo: utente.ruolo,
      deveCambiarePassword: utente.deveCambiarePassword,
    };

    // il cast serve perché JWT_EXPIRES_IN arriva da .env come stringa generica
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
  }

  public generaRefreshToken(utente: Utente): string {
    // payload minimo: al refresh andiamo comunque a rileggere l'utente dal
    // database, così un cambio di ruolo o una disabilitazione si riflettono
    // subito, invece di restare "congelati" nel vecchio token
    return jwt.sign({ id: utente.id }, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
  }

  public verificaRefreshToken(refreshToken: string): { id: string } | null {
    try {
      return jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string };
    } catch {
      return null;
    }
  }
}
