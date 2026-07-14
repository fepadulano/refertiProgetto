import { RuoloUtente } from "../entities/Utente";
import { ErroreAutorizzazione } from "./erroriDominio";
import { injectable, inject } from "tsyringe";
import { IUtenteRepository, IPazienteRepository } from "./ports";

export interface RicercaPazienteInput {
  medicoUtenteId: string; // Chi sta cercando (dal token JWT)
  codiceFiscale: string;
}

export interface RicercaPazienteOutput {
  pazienteId: string;
  utenteId: string;
  nome: string;
  cognome: string;
  codiceFiscale: string;
  dataNascita: Date;
}

@injectable()
export class RicercaPazienteUseCase {
  constructor(
    @inject("IUtenteRepository") private utenteRepo: IUtenteRepository,
    @inject("IPazienteRepository") private pazienteRepo: IPazienteRepository,
  ) {}

  public async execute(
    input: RicercaPazienteInput,
  ): Promise<RicercaPazienteOutput> {
    const richiedente = await this.utenteRepo.findById(input.medicoUtenteId);
    if (!richiedente || richiedente.ruolo !== RuoloUtente.MEDICO) {
      throw new ErroreAutorizzazione(
        "Accesso negato: la ricerca pazienti è riservata ai medici.",
      );
    }

    const paziente = await this.pazienteRepo.findByCodiceFiscale(
      input.codiceFiscale,
    );
    if (!paziente) {
      throw new Error("Nessun paziente trovato con questo codice fiscale.");
    }

    const utentePaziente = await this.utenteRepo.findById(paziente.utenteId);
    if (!utentePaziente) {
      throw new Error("Dati anagrafici del paziente incompleti.");
    }

    return {
      pazienteId: paziente.id,
      utenteId: paziente.utenteId,
      nome: utentePaziente.nome,
      cognome: utentePaziente.cognome,
      codiceFiscale: paziente.codiceFiscale,
      dataNascita: paziente.dataNascita,
    };
  }
}
