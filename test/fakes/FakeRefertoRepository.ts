import { Referto } from "../../src/entities/Referto";
import {
  IRefertoRepository,
  FiltriStoricoReferti,
} from "../../src/use_cases/ports";

export class FakeRefertoRepository implements IRefertoRepository {
  public referti: Referto[] = [];

  public async salva(referto: Referto): Promise<void> {
    this.referti.push(referto);
  }

  public async findById(id: string): Promise<Referto | null> {
    return this.referti.find((r) => r.id === id) ?? null;
  }

  public async findByPazienteId(
    pazienteId: string,
    filtri?: FiltriStoricoReferti,
  ): Promise<Referto[]> {
    let risultato = this.referti.filter((r) => r.pazienteId === pazienteId);

    if (filtri?.categoria) {
      risultato = risultato.filter((r) => r.categoria === filtri.categoria);
    }
    if (filtri?.dataInizio) {
      const dataInizio = filtri.dataInizio;
      risultato = risultato.filter((r) => r.dataCaricamento >= dataInizio);
    }
    if (filtri?.dataFine) {
      const dataFine = filtri.dataFine;
      risultato = risultato.filter((r) => r.dataCaricamento <= dataFine);
    }

    return risultato.sort(
      (a, b) => b.dataCaricamento.getTime() - a.dataCaricamento.getTime(),
    );
  }
}
