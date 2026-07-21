import { Utente, RuoloUtente } from "../../src/entities/Utente";
import { IUtenteRepository } from "../../src/use_cases/ports";

// Implementazione in memoria di IUtenteRepository, usata solo nei test:
// niente Postgres, niente Sequelize, solo un array che vive in RAM.
export class FakeUtenteRepository implements IUtenteRepository {
  public utenti: Utente[] = [];

  public async findById(id: string): Promise<Utente | null> {
    return this.utenti.find((u) => u.id === id) ?? null;
  }

  public async findByEmail(email: string): Promise<Utente | null> {
    return this.utenti.find((u) => u.email === email) ?? null;
  }

  public async findByIdConProfilo(id: string): Promise<Utente | null> {
    // Nei test il profilo (profiloMedico/profiloPaziente) viene già
    // attaccato all'Utente prima di salvarlo, quindi basta ritrovarlo.
    return this.findById(id);
  }

  public async findTuttiMediciConProfilo(): Promise<Utente[]> {
    return this.utenti.filter((u) => u.ruolo === RuoloUtente.MEDICO);
  }

  public async esisteEmail(email: string): Promise<boolean> {
    return this.utenti.some((u) => u.email === email);
  }

  public async salva(utente: Utente): Promise<void> {
    this.utenti.push(utente);
  }

  public async aggiorna(utente: Utente): Promise<void> {
    const indice = this.utenti.findIndex((u) => u.id === utente.id);
    if (indice !== -1) {
      this.utenti[indice] = utente;
    }
  }
}
