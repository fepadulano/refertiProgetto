// Token di transazione "opaco": i use case lo ricevono e lo ripassano ai
// repository senza mai sapere cosa contiene davvero (è Sequelize a darci
// un significato concreto, nello strato Frameworks & Drivers).
export type Transazione = unknown;

export interface IGestoreTransazioni {
  // Esegue "operazione" dentro un'unica transazione RDBMS (RNF2): se
  // operazione lancia un errore, tutte le scritture fatte fino a quel
  // punto vengono annullate automaticamente (rollback), invece di
  // lasciare nel database uno stato parziale.
  esegui<T>(operazione: (transazione: Transazione) => Promise<T>): Promise<T>;
}
