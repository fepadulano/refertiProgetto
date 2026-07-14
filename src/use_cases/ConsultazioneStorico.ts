import { Referto } from "../entities/Referto";
import { RuoloUtente } from "../entities/Utente";
import { ErroreAutorizzazione } from "./erroriDominio";
import { injectable, inject } from "tsyringe";
import { IUtenteRepository, IRefertoRepository } from "./ports";

export interface ConsultazioneStoricoInput {
  utenteId: string; // Chi sta chiedendo lo storico (dal token JWT)
  pazienteId: string; // Di quale paziente si vuole lo storico
  categoria?: string;
  dataInizio?: Date;
  dataFine?: Date;
}

@injectable()
export class ConsultazioneStoricoUseCase {
  constructor(
    @inject("IUtenteRepository") private utenteRepo: IUtenteRepository,
    @inject("IRefertoRepository") private refertoRepo: IRefertoRepository,
  ) {}

  public async execute(input: ConsultazioneStoricoInput): Promise<Referto[]> {
    const utente = await this.utenteRepo.findByIdConProfilo(input.utenteId);
    if (!utente) {
      throw new Error("Utente non trovato");
    }

    // Un medico può consultare lo storico di qualsiasi paziente; un paziente
    // può consultare solo il proprio (stessa logica di autorizzazione di DownloadReferto)
    let autorizzato = false;

    if (utente.ruolo === RuoloUtente.MEDICO && utente.profiloMedico) {
      autorizzato = true;
    } else if (
      utente.ruolo === RuoloUtente.PAZIENTE &&
      utente.profiloPaziente &&
      utente.profiloPaziente.id === input.pazienteId
    ) {
      autorizzato = true;
    }

    if (!autorizzato) {
      throw new ErroreAutorizzazione(
        "Accesso negato: non hai i permessi per consultare questo storico clinico.",
      );
    }

    return this.refertoRepo.findByPazienteId(input.pazienteId, {
      categoria: input.categoria,
      dataInizio: input.dataInizio,
      dataFine: input.dataFine,
    });
  }
}
