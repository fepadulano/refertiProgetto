import { Referto, CategoriaReferto } from "../entities/Referto";
import { RuoloUtente } from "../entities/Utente";
import { ErroreAutorizzazione } from "./erroriDominio";
import { injectable, inject } from "tsyringe";
import { IUtenteRepository, IRefertoRepository } from "./ports";

export interface ConsultazioneStoricoInput {
  utenteId: string; // chi fa la richiesta (dal token JWT)
  pazienteId: string;
  categoria?: CategoriaReferto;
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

    // Un medico vede lo storico di chiunque; un paziente solo il proprio
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
