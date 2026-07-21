import { Medico } from "../../entities/Medico";
import { Transazione } from "./IGestoreTransazioni";

export interface IMedicoRepository {
  salva(medico: Medico, transazione?: Transazione): Promise<void>;
}
