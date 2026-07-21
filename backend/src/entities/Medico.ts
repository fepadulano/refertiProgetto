export class Medico {
  constructor(
    public readonly id: string,
    public readonly utenteId: string,
    public specializzazione: string,
    public numeroMatricola: string,
  ) {}
}
