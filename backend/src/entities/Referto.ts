// Lista fissa, non testo libero: altrimenti due medici potrebbero descrivere
// lo stesso esame in modi diversi, rendendo i filtri sullo storico inaffidabili.
export enum CategoriaReferto {
  RADIOLOGIA = "Radiologia",
  ECOGRAFIA = "Ecografia",
  RISONANZA = "Risonanza",
  TAC = "TAC",
  ESAMI_DEL_SANGUE = "Esami del sangue",
  ELETTROCARDIOGRAMMA = "Elettrocardiogramma",
  VISITA_SPECIALISTICA = "Visita specialistica",
  ALTRO = "Altro",
}

export class Referto {
  constructor(
    public readonly id: string, // Chiave primaria del referto
    public readonly medicoId: string, // FK che punta a Medico
    public readonly pazienteId: string, // FK che punta a Paziente
    public percorsoFile: string, // Dove è salvato fisicamente il PDF sul server
    public categoria: CategoriaReferto,
    public readonly dataEsame: Date, // Quando è stato eseguito l'esame (RF4), indicata dal medico
    public readonly dataCaricamento: Date = new Date(),
  ) {}
}
