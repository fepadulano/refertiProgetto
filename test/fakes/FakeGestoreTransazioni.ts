import { IGestoreTransazioni, Transazione } from "../../src/use_cases/ports";

// Nei test unitari non serve una vera transazione Postgres (quella è
// verificata a parte, nella suite e2e, contro il database reale): qui
// basta eseguire l'operazione ricevuta con un valore fittizio al posto
// del token di transazione vero.
export class FakeGestoreTransazioni implements IGestoreTransazioni {
  public async esegui<T>(
    operazione: (transazione: Transazione) => Promise<T>,
  ): Promise<T> {
    return operazione(undefined);
  }
}
