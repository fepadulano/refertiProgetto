import { Medico } from "../../src/entities/Medico";
import { IMedicoRepository } from "../../src/use_cases/ports";

export class FakeMedicoRepository implements IMedicoRepository {
  public medici: Medico[] = [];

  public async salva(medico: Medico): Promise<void> {
    this.medici.push(medico);
  }
}
