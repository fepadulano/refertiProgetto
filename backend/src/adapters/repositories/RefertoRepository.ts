import { Op, Transaction, WhereOptions } from "sequelize";
import { Referto } from "../../entities/Referto";
import { RefertoModel } from "../../frameworks/database/models/RefertoModel";
import {
  IRefertoRepository,
  FiltriStoricoReferti,
  Transazione,
} from "../../use_cases/ports";

export class RefertoRepository implements IRefertoRepository {
  public async salva(referto: Referto, transazione?: Transazione): Promise<void> {
    await RefertoModel.create(
      {
        id: referto.id,
        medicoId: referto.medicoId,
        pazienteId: referto.pazienteId,
        percorsoFile: referto.percorsoFile,
        categoria: referto.categoria,
        dataEsame: referto.dataEsame,
        dataCaricamento: referto.dataCaricamento,
      },
      { transaction: transazione as Transaction | undefined },
    );
  }

  public async findById(id: string): Promise<Referto | null> {
    const refertoDb = await RefertoModel.findByPk(id);

    if (!refertoDb) {
      return null;
    }

    return this.mappaEntita(refertoDb);
  }

  // RF5/RF7: storico di un paziente, dal più recente al più vecchio, con filtri opzionali
  public async findByPazienteId(
    pazienteId: string,
    filtri?: FiltriStoricoReferti,
  ): Promise<Referto[]> {
    const where: WhereOptions = { pazienteId };

    if (filtri?.categoria) {
      // case-insensitive: "radiografia" e "Radiografia" sono la stessa categoria
      where.categoria = { [Op.iLike]: filtri.categoria.trim() };
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

  private mappaEntita(refertoDb: RefertoModel): Referto {
    return new Referto(
      refertoDb.id as string,
      refertoDb.medicoId as string,
      refertoDb.pazienteId as string,
      refertoDb.percorsoFile as string,
      refertoDb.categoria as string,
      refertoDb.dataEsame as Date,
      refertoDb.dataCaricamento as Date,
    );
  }
}
