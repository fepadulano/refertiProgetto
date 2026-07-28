import { Transaction } from "sequelize";
import { Paziente } from "../../entities/Paziente";
import { PazienteModel } from "../../frameworks/database/models/PazienteModel";
import { IPazienteRepository, Transazione } from "../../use_cases/ports";

export class PazienteRepository implements IPazienteRepository {
  public async salva(
    paziente: Paziente,
    transazione?: Transazione,
  ): Promise<void> {
    await PazienteModel.create(
      {
        id: paziente.id,
        utenteId: paziente.utenteId,
        codiceFiscale: paziente.codiceFiscale,
        dataNascita: paziente.dataNascita,
      },
      { transaction: transazione as Transaction | undefined },
    );
  }

  public async findByUtenteId(utenteId: string): Promise<Paziente | null> {
    const pazienteDb = await PazienteModel.findOne({ where: { utenteId } });

    if (!pazienteDb) {
      return null;
    }

    return new Paziente(
      pazienteDb.id as string,
      pazienteDb.utenteId as string,
      pazienteDb.codiceFiscale as string,
      pazienteDb.dataNascita as Date,
    );
  }

  // RF3: ricerca anagrafica tramite codice fiscale
  public async findByCodiceFiscale(
    codiceFiscale: string,
  ): Promise<Paziente | null> {
    const pazienteDb = await PazienteModel.findOne({
      where: { codiceFiscale },
    });

    if (!pazienteDb) {
      return null;
    }

    return new Paziente(
      pazienteDb.id as string,
      pazienteDb.utenteId as string,
      pazienteDb.codiceFiscale as string,
      pazienteDb.dataNascita as Date,
    );
  }
}
