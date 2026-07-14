import { Medico } from "../../entities/Medico";

export interface IMedicoRepository {
  salva(medico: Medico): Promise<void>;
}
