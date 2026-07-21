export class Referto {
  constructor(
    public readonly id: string, // Chiave primaria del referto
    public readonly medicoId: string, // FK che punta a Medico
    public readonly pazienteId: string, // FK che punta a Paziente
    public percorsoFile: string, // Dove è salvato fisicamente il PDF sul server
    public categoria: string, // Es. "Esame del sangue", "Radiografia" (visto dal tuo schema)
    public readonly dataEsame: Date, // Quando è stato eseguito l'esame (RF4), indicata dal medico
    public readonly dataCaricamento: Date = new Date(),
  ) {}
}
