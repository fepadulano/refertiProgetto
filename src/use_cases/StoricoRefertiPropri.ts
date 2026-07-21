import { Referto } from "../entities/Referto";
import { RuoloUtente } from "../entities/Utente";
import { ErroreAutorizzazione } from "./erroriDominio";
import { injectable, inject } from "tsyringe";
import { IUtenteRepository, IRefertoRepository } from "./ports";

export interface StoricoRefertiPropriInput {
  utenteId: string; // Chi sta chiedendo il proprio storico (dal token JWT)
  categoria?: string;
  dataInizio?: Date;
  dataFine?: Date;
}

// A differenza di ConsultazioneStoricoUseCase (dove il chiamante indica DI CHI
// vuole vedere lo storico, es. un medico), qui il paziente vede solo il proprio:
// risolviamo noi il suo pazienteId a partire dall'utenteId nel token.
@injectable()
export class StoricoRefertiPropriUseCase {
  constructor(
    @inject("IUtenteRepository") private utenteRepo: IUtenteRepository,
    @inject("IRefertoRepository") private refertoRepo: IRefertoRepository,
  ) {}

  public async execute(input: StoricoRefertiPropriInput): Promise<Referto[]> {
    const utente = await this.utenteRepo.findByIdConProfilo(input.utenteId);

    if (
      !utente ||
      utente.ruolo !== RuoloUtente.PAZIENTE ||
      !utente.profiloPaziente
    ) {
      throw new ErroreAutorizzazione(
        "Accesso negato: solo un account paziente può consultare il proprio storico clinico.",
      );
    }

    return this.refertoRepo.findByPazienteId(utente.profiloPaziente.id, {
      categoria: input.categoria,
      dataInizio: input.dataInizio,
      dataFine: input.dataFine,
    });
  }
}
