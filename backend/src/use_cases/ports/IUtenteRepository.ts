import { Utente } from "../../entities/Utente";
import { Transazione } from "./IGestoreTransazioni";

export interface IUtenteRepository {
  findById(id: string): Promise<Utente | null>;
  findByEmail(email: string): Promise<Utente | null>;
  findByIdConProfilo(id: string): Promise<Utente | null>;
  findTuttiMediciConProfilo(): Promise<Utente[]>;
  esisteEmail(email: string): Promise<boolean>;
  salva(utente: Utente, transazione?: Transazione): Promise<void>;
  // aggiorna un utente già esistente (es. disabilitazione account)
  aggiorna(utente: Utente, transazione?: Transazione): Promise<void>;
}
