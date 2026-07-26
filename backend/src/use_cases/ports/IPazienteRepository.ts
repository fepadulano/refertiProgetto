import { Paziente } from "../../entities/Paziente";
import { Transazione } from "./IGestoreTransazioni";

export interface IPazienteRepository {
  salva(paziente: Paziente, transazione?: Transazione): Promise<void>;
  findByCodiceFiscale(codiceFiscale: string): Promise<Paziente | null>;
  findByUtenteId(utenteId: string): Promise<Paziente | null>;
}
