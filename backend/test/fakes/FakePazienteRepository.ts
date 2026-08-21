import { Paziente } from "../../src/entities/Paziente";
import { IPazienteRepository } from "../../src/use_cases/ports";

export class FakePazienteRepository implements IPazienteRepository {
  public pazienti: Paziente[] = [];

  public async salva(paziente: Paziente): Promise<void> {
    this.pazienti.push(paziente);
  }

  public async findByCodiceFiscale(
    codiceFiscale: string,
  ): Promise<Paziente | null> {
    return (
      this.pazienti.find((p) => p.codiceFiscale === codiceFiscale) ?? null
    );
  }

  public async findByUtenteId(utenteId: string): Promise<Paziente | null> {
    return this.pazienti.find((p) => p.utenteId === utenteId) ?? null;
  }
}
