import { Transaction } from "sequelize";
import { Medico } from "../../entities/Medico";
import { Paziente } from "../../entities/Paziente";
import { Utente, RuoloUtente } from "../../entities/Utente";
import { MedicoModel } from "../../frameworks/database/models/MedicoModel";
import { PazienteModel } from "../../frameworks/database/models/PazienteModel";
import { UtenteModel } from "../../frameworks/database/models/UtenteModel";
import { IUtenteRepository, Transazione } from "../../use_cases/ports";

export class UtenteRepository implements IUtenteRepository {
  public async esisteEmail(email: string): Promise<boolean> {
    const count = await UtenteModel.count({ where: { email } });
    return count > 0;
  }

  public async salva(utente: Utente, transazione?: Transazione): Promise<void> {
    await UtenteModel.create(
      {
        id: utente.id,
        nome: utente.nome,
        cognome: utente.cognome,
        email: utente.email,
        passwordHash: utente.passwordHash,
        ruolo: utente.ruolo,
        attivo: utente.attivo,
      },
      { transaction: transazione as Transaction | undefined },
    );
  }

  public async aggiorna(
    utente: Utente,
    transazione?: Transazione,
  ): Promise<void> {
    await UtenteModel.update(
      { attivo: utente.attivo },
      {
        where: { id: utente.id },
        transaction: transazione as Transaction | undefined,
      },
    );
  }

  public async findById(id: string): Promise<Utente | null> {
    const utenteDb = await UtenteModel.findByPk(id);

    if (!utenteDb) {
      return null;
    }

    return new Utente(
      utenteDb.id as string,
      utenteDb.nome as string,
      utenteDb.cognome as string,
      utenteDb.email as string,
      utenteDb.passwordHash as string,
      utenteDb.ruolo as RuoloUtente,
      utenteDb.attivo as boolean,
    );
  }

  public async findByEmail(email: string): Promise<Utente | null> {
    const utenteDb = await UtenteModel.findOne({ where: { email } });
    if (!utenteDb) return null;

    return new Utente(
      utenteDb.id as string,
      utenteDb.nome as string,
      utenteDb.cognome as string,
      utenteDb.email as string,
      utenteDb.passwordHash as string,
      utenteDb.ruolo as RuoloUtente,
      utenteDb.attivo as boolean,
    );
  }

  // include il profilo Medico o Paziente allegato
  public async findByIdConProfilo(id: string): Promise<Utente | null> {
    const utente = await this.findById(id);
    if (!utente) return null;

    if (utente.ruolo === RuoloUtente.MEDICO) {
      const medicoDb = await MedicoModel.findOne({
        where: { utenteId: utente.id },
      });
      if (medicoDb) {
        utente.profiloMedico = new Medico(
          medicoDb.id as string,
          medicoDb.utenteId as string,
          medicoDb.specializzazione as string,
          medicoDb.numeroMatricola as string,
        );
      }
    }

    if (utente.ruolo === RuoloUtente.PAZIENTE) {
      const pazienteDb = await PazienteModel.findOne({
        where: { utenteId: utente.id },
      });
      if (pazienteDb) {
        utente.profiloPaziente = new Paziente(
          pazienteDb.id as string,
          pazienteDb.utenteId as string,
          pazienteDb.codiceFiscale as string,
          pazienteDb.dataNascita as Date,
        );
      }
    }

    return utente;
  }

  // tutti gli utenti MEDICO, ciascuno con il proprio profilo allegato
  public async findTuttiMediciConProfilo(): Promise<Utente[]> {
    const utentiDb = await UtenteModel.findAll({
      where: { ruolo: RuoloUtente.MEDICO },
      order: [
        ["cognome", "ASC"],
        ["nome", "ASC"],
      ],
    });

    const mediciDb = await MedicoModel.findAll({
      where: { utenteId: utentiDb.map((utenteDb) => utenteDb.id) },
    });

    return utentiDb.map((utenteDb) => {
      const utente = new Utente(
        utenteDb.id as string,
        utenteDb.nome as string,
        utenteDb.cognome as string,
        utenteDb.email as string,
        utenteDb.passwordHash as string,
        utenteDb.ruolo as RuoloUtente,
        utenteDb.attivo as boolean,
      );

      const medicoDb = mediciDb.find((m) => m.utenteId === utenteDb.id);
      if (medicoDb) {
        utente.profiloMedico = new Medico(
          medicoDb.id as string,
          medicoDb.utenteId as string,
          medicoDb.specializzazione as string,
          medicoDb.numeroMatricola as string,
        );
      }

      return utente;
    });
  }
}
