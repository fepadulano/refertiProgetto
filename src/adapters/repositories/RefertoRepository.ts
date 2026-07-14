import { Op, WhereOptions } from "sequelize";
import { Referto } from "../../entities/Referto";
import { RefertoModel } from "../../frameworks/database/models/RefertoModel";
import {
  IRefertoRepository,
  FiltriStoricoReferti,
} from "../../use_cases/ports";

// Questa classe soddisfa i requisiti sia del caso d'uso di Upload che di quello di Download
export class RefertoRepository implements IRefertoRepository {
  // Salva il referto nel database (usato in UploadReferto)
  public async salva(referto: Referto): Promise<void> {
    await RefertoModel.create({
      id: referto.id,
      medicoId: referto.medicoId,
      pazienteId: referto.pazienteId,
      percorsoFile: referto.percorsoFile,
      categoria: referto.categoria,
      dataCaricamento: referto.dataCaricamento,
    });
  }

  // Cerca un referto tramite il suo ID (usato in DownloadReferto)
  public async findById(id: string): Promise<Referto | null> {
    const refertoDb = await RefertoModel.findByPk(id);

    if (!refertoDb) {
      return null;
    }

    return this.mappaEntita(refertoDb);
  }

  // Storico referti di un paziente, dal più recente al più vecchio, con filtri opzionali (RF5/RF7)
  public async findByPazienteId(
    pazienteId: string,
    filtri?: FiltriStoricoReferti,
  ): Promise<Referto[]> {
    const where: WhereOptions = { pazienteId };

    if (filtri?.categoria) {
      where.categoria = filtri.categoria;
    }

    if (filtri?.dataInizio && filtri?.dataFine) {
      where.dataCaricamento = {
        [Op.between]: [filtri.dataInizio, filtri.dataFine],
      };
    } else if (filtri?.dataInizio) {
      where.dataCaricamento = { [Op.gte]: filtri.dataInizio };
    } else if (filtri?.dataFine) {
      where.dataCaricamento = { [Op.lte]: filtri.dataFine };
    }

    const refertiDb = await RefertoModel.findAll({
      where,
      order: [["dataCaricamento", "DESC"]],
    });

    return refertiDb.map((refertoDb) => this.mappaEntita(refertoDb));
  }

  // Traduce il modello Sequelize nell'Entità pura Referto
  private mappaEntita(refertoDb: RefertoModel): Referto {
    return new Referto(
      refertoDb.id as string,
      refertoDb.medicoId as string,
      refertoDb.pazienteId as string,
      refertoDb.percorsoFile as string,
      refertoDb.categoria as string,
      refertoDb.dataCaricamento as Date,
    );
  }
}
