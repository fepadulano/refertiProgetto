import { Transaction } from "sequelize";
import { Medico } from "../../entities/Medico";
import { MedicoModel } from "../../frameworks/database/models/MedicoModel";
import { IMedicoRepository, Transazione } from "../../use_cases/ports";

export class MedicoRepository implements IMedicoRepository {
  public async salva(medico: Medico, transazione?: Transazione): Promise<void> {
    await MedicoModel.create(
      {
        id: medico.id,
        utenteId: medico.utenteId,
        numeroMatricola: medico.numeroMatricola,
        specializzazione: medico.specializzazione,
      },
      { transaction: transazione as Transaction | undefined },
    );
  }

  public async findByUtenteId(utenteId: string): Promise<Medico | null> {
    const medicoDb = await MedicoModel.findOne({ where: { utenteId } });

    if (!medicoDb) {
      return null;
    }

    return new Medico(
      medicoDb.id as string,
      medicoDb.utenteId as string,
      medicoDb.numeroMatricola as string,
      medicoDb.specializzazione as string,
    );
  }
}
