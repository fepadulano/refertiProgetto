import { Utente } from "../../entities/Utente";
import { Transazione } from "./IGestoreTransazioni";

export interface IUtenteRepository {
  findById(id: string): Promise<Utente | null>;
  findByEmail(email: string): Promise<Utente | null>;
  findByIdConProfilo(id: string): Promise<Utente | null>;
  // Tutti gli utenti con ruolo MEDICO, ciascuno con il proprio profiloMedico allegato
  findTuttiMediciConProfilo(): Promise<Utente[]>;
  esisteEmail(email: string): Promise<boolean>;
  salva(utente: Utente, transazione?: Transazione): Promise<void>;
  // Persiste modifiche di stato su un utente già esistente (es. disabilitazione account)
  aggiorna(utente: Utente, transazione?: Transazione): Promise<void>;
}
