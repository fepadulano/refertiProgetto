import { Referto } from "../../entities/Referto";

export interface FiltriStoricoReferti {
  categoria?: string;
  dataInizio?: Date;
  dataFine?: Date;
}

export interface IRefertoRepository {
  salva(referto: Referto): Promise<void>;
  findById(id: string): Promise<Referto | null>;
  // Elenco storico di un paziente, dal più recente al più vecchio (RF5), con filtri opzionali (RF7)
  findByPazienteId(
    pazienteId: string,
    filtri?: FiltriStoricoReferti,
  ): Promise<Referto[]>;
}
