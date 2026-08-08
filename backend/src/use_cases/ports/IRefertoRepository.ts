import { Referto, CategoriaReferto } from "../../entities/Referto";
import { Transazione } from "./IGestoreTransazioni";

export interface FiltriStoricoReferti {
  categoria?: CategoriaReferto;
  dataInizio?: Date;
  dataFine?: Date;
}

export interface IRefertoRepository {
  salva(referto: Referto, transazione?: Transazione): Promise<void>;
  findById(id: string): Promise<Referto | null>;
  // storico di un paziente, dal più recente al più vecchio, con filtri opzionali
  findByPazienteId(
    pazienteId: string,
    filtri?: FiltriStoricoReferti,
  ): Promise<Referto[]>;
}
