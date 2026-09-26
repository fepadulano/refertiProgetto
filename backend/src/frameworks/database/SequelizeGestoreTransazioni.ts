import { database } from "./database";
import { IGestoreTransazioni, Transazione } from "../../use_cases/ports";

export class SequelizeGestoreTransazioni implements IGestoreTransazioni {
  public async esegui(
    operazione: (transazione: Transazione) => Promise<void>,
  ): Promise<void> {
    // commit se operazione va a buon fine, rollback automatico se lancia un errore
    return database.transaction((t) => operazione(t));
  }
}
