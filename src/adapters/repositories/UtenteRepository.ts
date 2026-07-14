import { Medico } from "../../entities/Medico";
import { Paziente } from "../../entities/Paziente";
import { Utente, RuoloUtente } from "../../entities/Utente";
import { MedicoModel } from "../../frameworks/database/models/MedicoModel";
import { PazienteModel } from "../../frameworks/database/models/PazienteModel";
import { UtenteModel } from "../../frameworks/database/models/UtenteModel";
import { IUtenteRepository } from "../../use_cases/ports";

export class UtenteRepository implements IUtenteRepository {
  // Controlla se un'email è già registrata (usato sia da Paziente che da Medico)
  public async esisteEmail(email: string): Promise<boolean> {
    const count = await UtenteModel.count({ where: { email } });
    return count > 0;
  }

  // Salva l'entità pura nel database usando Sequelize
  public async salva(utente: Utente): Promise<void> {
    await UtenteModel.create({
      id: utente.id,
      nome: utente.nome,
      cognome: utente.cognome,
      email: utente.email,
      passwordHash: utente.passwordHash,
      ruolo: utente.ruolo,
      attivo: utente.attivo,
    });
  }

  // Persiste modifiche di stato su un utente esistente (es. disabilitazione account)
  public async aggiorna(utente: Utente): Promise<void> {
    await UtenteModel.update(
      { attivo: utente.attivo },
      { where: { id: utente.id } },
    );
  }

  // Cerca un utente per ID (serve al CreaMedicoUseCase per verificare se chi crea è un ADMIN)
  public async findById(id: string): Promise<Utente | null> {
    const utenteDb = await UtenteModel.findByPk(id);

    if (!utenteDb) {
      return null;
    }

    // Se lo trova nel DB, lo "traduce" di nuovo nell'Entità pura per i Casi d'Uso
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

  // Serve al LoginUseCase per trovare l'utente dalla sua email
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

  // Serve a Upload/Download Referto per avere l'Utente con il suo profilo Medico o Paziente allegato
  public async findByIdConProfilo(id: string): Promise<Utente | null> {
    const utente = await this.findById(id);
    if (!utente) return null;

    // Se è medico, andiamo a pescargli il profilo medico
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

    // Se è paziente, andiamo a pescargli il profilo paziente
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
}
