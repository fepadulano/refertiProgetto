import { Response } from "express";
import { injectable, inject } from "tsyringe";
import { RicercaPazienteUseCase } from "../../use_cases/RicercaPaziente";
import { ConsultazioneStoricoUseCase } from "../../use_cases/ConsultazioneStorico";
import { StoricoRefertiPropriUseCase } from "../../use_cases/StoricoRefertiPropri";
import { AuthRequest } from "../../frameworks/web/middlewares/auth.middleware";
import { gestisciErroreHttp } from "./gestisciErroreHttp";

@injectable()
export class PazientiController {
  constructor(
    @inject(RicercaPazienteUseCase)
    private ricercaPazienteUseCase: RicercaPazienteUseCase,
    @inject(ConsultazioneStoricoUseCase)
    private consultazioneStoricoUseCase: ConsultazioneStoricoUseCase,
    @inject(StoricoRefertiPropriUseCase)
    private storicoRefertiPropriUseCase: StoricoRefertiPropriUseCase,
  ) {}

  // RF3: il Medico cerca un paziente per Codice Fiscale
  public cerca = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const medicoUtenteId = req.user?.id;
      if (!medicoUtenteId) throw new Error("Utente non autenticato");

      // già validato da validaQuery in pazienti.routes.ts
      const codiceFiscale = req.query.codiceFiscale as string;

      const paziente = await this.ricercaPazienteUseCase.execute({
        medicoUtenteId,
        codiceFiscale,
      });

      res.status(200).json(paziente);
    } catch (error) {
      gestisciErroreHttp(error, res);
    }
  };

  // RF5/RF7: elenco (filtrabile) dei referti di un paziente
  public listaReferti = async (
    req: AuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const utenteId = req.user?.id;
      if (!utenteId) throw new Error("Utente non autenticato");

      const pazienteId = req.params.id as string;
      const { categoria, dataInizio, dataFine } = req.query;

      const referti = await this.consultazioneStoricoUseCase.execute({
        utenteId,
        pazienteId,
        categoria: categoria as string | undefined,
        dataInizio: dataInizio ? new Date(dataInizio as string) : undefined,
        dataFine: dataFine ? new Date(dataFine as string) : undefined,
      });

      res.status(200).json({ referti });
    } catch (error) {
      gestisciErroreHttp(error, res);
    }
  };

  // RF5/RF7: il Paziente consulta il proprio storico (senza dover conoscere il proprio pazienteId)
  public ilMioStorico = async (
    req: AuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const utenteId = req.user?.id;
      if (!utenteId) throw new Error("Utente non autenticato");

      const { categoria, dataInizio, dataFine } = req.query;

      const referti = await this.storicoRefertiPropriUseCase.execute({
        utenteId,
        categoria: categoria as string | undefined,
        dataInizio: dataInizio ? new Date(dataInizio as string) : undefined,
        dataFine: dataFine ? new Date(dataFine as string) : undefined,
      });

      res.status(200).json({ referti });
    } catch (error) {
      gestisciErroreHttp(error, res);
    }
  };
}
