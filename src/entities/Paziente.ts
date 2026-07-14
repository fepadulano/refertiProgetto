export class Paziente {
  constructor(
    public readonly id: string, // La chiave primaria del paziente
    public readonly utenteId: string, // Il collegamento (chiave esterna logica) all'Utente padre
    public codiceFiscale: string,
    public dataNascita: Date,
  ) {}
}
