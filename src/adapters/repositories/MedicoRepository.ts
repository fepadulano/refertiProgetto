import { Transaction } from "sequelize";
import { Medico } from "../../entities/Medico";
import { MedicoModel } from "../../frameworks/database/models/MedicoModel";
import { IMedicoRepository, Transazione } from "../../use_cases/ports";

export class MedicoRepository implements IMedicoRepository {
  // Salva l'entità Medico nel database
  public async salva(medico: Medico, transazione?: Transazione): Promise<void> {
    await MedicoModel.create(
      {
        id: medico.id,
        utenteId: medico.utenteId, // Ricorda di controllare che nella tua entità si chiami utenteId
        numeroMatricola: medico.numeroMatricola,
        specializzazione: medico.specializzazione,
      },
      { transaction: transazione as Transaction | undefined },
    );
  }

  // Ricerca un medico dal suo ID Utente (utile per il login del medico)
  public async findByUtenteId(utenteId: string): Promise<Medico | null> {
    const medicoDb = await MedicoModel.findOne({ where: { utenteId } });

    if (!medicoDb) {
      return null;
    }

    return new Medico(
      medicoDb.id as string,
      medicoDb.utenteId as string, // Lo passiamo all'entità come utenteId
      medicoDb.numeroMatricola as string,
      medicoDb.specializzazione as string,
    );
  }
}
