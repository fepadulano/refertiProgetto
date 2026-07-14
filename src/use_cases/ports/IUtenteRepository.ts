import { Utente } from "../../entities/Utente";

export interface IUtenteRepository {
  findById(id: string): Promise<Utente | null>;
  findByEmail(email: string): Promise<Utente | null>;
  findByIdConProfilo(id: string): Promise<Utente | null>;
  esisteEmail(email: string): Promise<boolean>;
  salva(utente: Utente): Promise<void>;
  // Persiste modifiche di stato su un utente già esistente (es. disabilitazione account)
  aggiorna(utente: Utente): Promise<void>;
}
