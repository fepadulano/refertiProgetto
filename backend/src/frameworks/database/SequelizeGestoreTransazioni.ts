import { database } from "./database";
import { IGestoreTransazioni, Transazione } from "../../use_cases/ports";

export class SequelizeGestoreTransazioni implements IGestoreTransazioni {
  public async esegui<T>(
    operazione: (transazione: Transazione) => Promise<T>,
  ): Promise<T> {
    // database.transaction si occupa di tutto: se "operazione" va a buon
    // fine fa la COMMIT, se lancia un errore fa la ROLLBACK automaticamente
    return database.transaction((t) => operazione(t));
  }
}
