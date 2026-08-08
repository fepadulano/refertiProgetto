import { Utente } from "../../entities/Utente";

export interface ITokenManager {
  generaToken(utente: Utente): string;
  generaRefreshToken(utente: Utente): string;
  // null se il refresh token non è valido o è scaduto
  verificaRefreshToken(refreshToken: string): { id: string } | null;
}
