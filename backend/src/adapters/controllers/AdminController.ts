import { Response } from "express";
import { injectable, inject } from "tsyringe";
import { CreaMedicoUseCase } from "../../use_cases/CreaMedico";
import { DisabilitaMedicoUseCase } from "../../use_cases/DisabilitaMedico";
import { ElencoMediciUseCase } from "../../use_cases/ElencoMedici";
import { AuthRequest } from "../../frameworks/web/middlewares/auth.middleware";
import { gestisciErroreHttp } from "./gestisciErroreHttp";

@injectable()
export class AdminController {
  constructor(
    @inject(CreaMedicoUseCase) private creaMedicoUseCase: CreaMedicoUseCase,
    @inject(DisabilitaMedicoUseCase)
    private disabilitaMedicoUseCase: DisabilitaMedicoUseCase,
    @inject(ElencoMediciUseCase)
    private elencoMediciUseCase: ElencoMediciUseCase,
  ) {}

  // Elenco dei medici registrati, usato dalla schermata admin per scegliere chi disabilitare
  public elencoMedici = async (
    req: AuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const adminId = req.user?.id;
      if (!adminId) throw new Error("Utente non autenticato");

      const medici = await this.elencoMediciUseCase.execute({ adminId });

      res.status(200).json({ medici });
    } catch (error) {
      gestisciErroreHttp(error, res);
    }
  };

  public creaMedico = async (
    req: AuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const adminId = req.user?.id;
      if (!adminId) throw new Error("Utente non autenticato");

      const {
        nome,
        cognome,
        email,
        password,
        specializzazione,
        numeroMatricola,
      } = req.body;
      const ipAddress = req.ip || "0.0.0.0";

      const nuovoMedico = await this.creaMedicoUseCase.execute({
        adminId,
        nome,
        cognome,
        email,
        passwordInChiaro: password,
        specializzazione,
        numeroMatricola,
        ipAddress,
      });

      res.status(201).json({
        messaggio: "Account Medico creato con successo",
        medicoId: nuovoMedico.id,
      });
    } catch (error) {
      gestisciErroreHttp(error, res);
    }
  };

  // RF2: l'Admin disabilita l'accesso a un medico non più operativo
  public disabilitaMedico = async (
    req: AuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const adminId = req.user?.id;
      if (!adminId) throw new Error("Utente non autenticato");

      const medicoUtenteId = req.params.id as string;
      const ipAddress = req.ip || "0.0.0.0";

      await this.disabilitaMedicoUseCase.execute({
        adminId,
        medicoUtenteId,
        ipAddress,
      });

      res
        .status(200)
        .json({ messaggio: "Account medico disabilitato con successo" });
    } catch (error) {
      gestisciErroreHttp(error, res);
    }
  };
}
