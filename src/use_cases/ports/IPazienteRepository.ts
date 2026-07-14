import { Paziente } from "../../entities/Paziente";

export interface IPazienteRepository {
  salva(paziente: Paziente): Promise<void>;
  findByCodiceFiscale(codiceFiscale: string): Promise<Paziente | null>;
}
