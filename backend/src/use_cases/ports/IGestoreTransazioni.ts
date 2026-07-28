// opaco per i use case: solo Sequelize sa cosa contiene davvero
export type Transazione = unknown;

export interface IGestoreTransazioni {
  // se operazione lancia un errore, fa rollback di tutte le scritture (RNF2)
  esegui<T>(operazione: (transazione: Transazione) => Promise<T>): Promise<T>;
}
