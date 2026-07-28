import { Request, Response } from "express";
import { RegistrazionePazienteUseCase } from "../../use_cases/RegistrazionePaziente";
import { injectable, inject } from "tsyringe";
import { LoginUseCase } from "../../use_cases/Login";
import { gestisciErroreHttp } from "./gestisciErroreHttp";
import { verificaCaptcha } from "../../frameworks/security/VerificatoreCaptcha";

@injectable()
export class AuthController {
  constructor(
    @inject(RegistrazionePazienteUseCase)
    private registrazioneUseCase: RegistrazionePazienteUseCase,
    @inject(LoginUseCase) private loginUseCase: LoginUseCase,
  ) {}

  public registraPaziente = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { nome, cognome, email, password, codiceFiscale, dataNascita } =
        req.body;
      const ipAddress = req.ip || "0.0.0.0";

      const nuovoUtente = await this.registrazioneUseCase.execute({
        nome,
        cognome,
        email,
        passwordInChiaro: password,
        codiceFiscale,
        dataNascita: new Date(dataNascita),
        ipAddress,
      });

      res.status(201).json({
        messaggio: "Paziente registrato con successo",
        utenteId: nuovoUtente.id,
      });
    } catch (error) {
      gestisciErroreHttp(error, res);
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, captchaToken } = req.body;
      const ipAddress = req.ip || "0.0.0.0";

      // verificato prima delle credenziali: il LoginUseCase resta ignaro del captcha
      const captchaValido = await verificaCaptcha(captchaToken);
      if (!captchaValido) {
        res.status(400).json({ errore: "Verifica captcha fallita, riprova." });
        return;
      }

      const token = await this.loginUseCase.execute({
        email,
        passwordInChiaro: password,
        ipAddress,
      });

      res.status(200).json({
        messaggio: "Login effettuato con successo",
        token: token,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({ errore: error.message });
      } else {
        res.status(500).json({ errore: "Errore interno del server" });
      }
    }
  };
}
