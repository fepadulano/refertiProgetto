import { Medico } from "./Medico";
import { Paziente } from "./Paziente";

export enum RuoloUtente {
  ADMIN = "ADMIN",
  MEDICO = "MEDICO",
  PAZIENTE = "PAZIENTE",
}

export class Utente {
  public profiloMedico?: Medico;
  public profiloPaziente?: Paziente;
  constructor(
    public readonly id: string,
    public nome: string, // Aggiunto in base allo schema
    public cognome: string, // Aggiunto in base allo schema
    public email: string,
    public passwordHash: string,
    public ruolo: RuoloUtente,
    public deveCambiarePassword: boolean = false,
    public attivo: boolean = true,
    public readonly createdAt: Date = new Date(), // Aggiunto in base allo schema
  ) {}

  public disabilitaAccount(): void {
    this.attivo = false;
  }

  public completaCambioPassword(nuovoHash: string): void {
    this.passwordHash = nuovoHash;
    this.deveCambiarePassword = false;
  }
}
