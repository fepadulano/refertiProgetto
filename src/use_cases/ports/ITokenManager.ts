import { Utente } from "../../entities/Utente";

export interface ITokenManager {
  generaToken(utente: Utente): string;
}
