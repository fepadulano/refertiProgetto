import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { LoginUseCase } from "../../use_cases/Login";
import { RefreshTokenUseCase } from "../../use_cases/RefreshToken";
import { CambiaPasswordUseCase } from "../../use_cases/CambiaPassword";
import { ITokenManager } from "../../use_cases/ports";
import { AuthRequest } from "../../frameworks/web/middlewares/auth.middleware";
import { gestisciErroreHttp } from "./gestisciErroreHttp";
import { verificaCaptcha } from "../../frameworks/security/VerificatoreCaptcha";

@injectable()
export class AuthController {
  constructor(
    @inject(LoginUseCase) private loginUseCase: LoginUseCase,
    @inject(RefreshTokenUseCase) private refreshTokenUseCase: RefreshTokenUseCase,
    @inject(CambiaPasswordUseCase)
    private cambiaPasswordUseCase: CambiaPasswordUseCase,
    @inject("ITokenManager") private tokenManager: ITokenManager,
  ) {}

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

      const { token, refreshToken } = await this.loginUseCase.execute({
        email,
        passwordInChiaro: password,
        ipAddress,
      });

      res.status(200).json({
        messaggio: "Login effettuato con successo",
        token,
        refreshToken,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({ errore: error.message });
      } else {
        res.status(500).json({ errore: "Errore interno del server" });
      }
    }
  };

  public refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      const token = await this.refreshTokenUseCase.execute({ refreshToken });

      res.status(200).json({ token });
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({ errore: error.message });
      } else {
        res.status(500).json({ errore: "Errore interno del server" });
      }
    }
  };

  // Sostituisce la password provvisoria data da un Admin (RF2, RF9) con una
  // scelta dal titolare dell'account. Restituisce un token nuovo, così il
  // frontend smette subito di considerare l'utente "da reindirizzare".
  public cambiaPassword = async (
    req: AuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const utenteId = req.user?.id;
      if (!utenteId) throw new Error("Utente non autenticato");

      const { passwordAttuale, nuovaPassword } = req.body;
      const ipAddress = req.ip || "0.0.0.0";

      const utenteAggiornato = await this.cambiaPasswordUseCase.execute({
        utenteId,
        passwordAttuale,
        nuovaPassword,
        ipAddress,
      });

      res.status(200).json({
        messaggio: "Password aggiornata con successo",
        token: this.tokenManager.generaToken(utenteAggiornato),
      });
    } catch (error) {
      gestisciErroreHttp(error, res);
    }
  };
}
