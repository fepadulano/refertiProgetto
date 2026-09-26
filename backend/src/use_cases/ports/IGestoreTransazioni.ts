export type Transazione = unknown;

export interface IGestoreTransazioni {
  // se operazione lancia un errore, fa rollback di tutte le scritture (RNF2)
  esegui(operazione: (transazione: Transazione) => Promise<void>): Promise<void>;
}
