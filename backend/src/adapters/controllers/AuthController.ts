import { Request, Response } from "express";
import { RegistrazionePazienteUseCase } from "../../use_cases/RegistrazionePaziente";
import { injectable, inject } from "tsyringe";
import { LoginUseCase } from "../../use_cases/Login";
import { gestisciErroreHttp } from "./gestisciErroreHttp";
import { verificaCaptcha } from "../../frameworks/security/VerificatoreCaptcha";

@injectable()
export class AuthController {
  // Il controller riceve il caso d'uso già "assemblato" tramite il costruttore
  constructor(
    @inject(RegistrazionePazienteUseCase)
    private registrazioneUseCase: RegistrazionePazienteUseCase,
    @inject(LoginUseCase) private loginUseCase: LoginUseCase,
  ) {}

  // Usiamo una arrow function per non perdere il riferimento a "this" quando Express chiamerà questa rotta
  public registraPaziente = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      // 1. Estraiamo i dati crudi inviati dal client nel body della richiesta
      const { nome, cognome, email, password, codiceFiscale, dataNascita } =
        req.body;

      // 2. Estraiamo l'IP di chi fa la richiesta (Express lo mette in req.ip)
      // Se req.ip è undefined per qualche motivo, mettiamo un fallback a '0.0.0.0'
      const ipAddress = req.ip || "0.0.0.0";

      // 3. Traduciamo la richiesta HTTP in una chiamata al nostro strato interno
      const nuovoUtente = await this.registrazioneUseCase.execute({
        nome,
        cognome,
        email,
        passwordInChiaro: password, // Mappiamo il campo 'password' del JSON con quello che si aspetta il nostro input
        codiceFiscale,
        dataNascita: new Date(dataNascita), // Convertiamo la stringa "YYYY-MM-DD" in un oggetto Date reale
        ipAddress,
      });

      // 4. Se tutto va a buon fine, rispondiamo con lo status 201 (Created)
      res.status(201).json({
        messaggio: "Paziente registrato con successo",
        utenteId: nuovoUtente.id,
      });
    } catch (error) {
      // 5. Gestione degli errori (es. "Email già in uso" o "Codice fiscale duplicato")
      gestisciErroreHttp(error, res);
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      // 1. Estraiamo i dati dal client
      const { email, password, captchaToken } = req.body;
      const ipAddress = req.ip || "0.0.0.0";

      // 2. Verifichiamo il captcha PRIMA di controllare le credenziali: se
      // fallisce, non chiamiamo nemmeno il caso d'uso (il LoginUseCase resta
      // ignaro dell'esistenza del captcha, è un dettaglio infrastrutturale).
      const captchaValido = await verificaCaptcha(captchaToken);
      if (!captchaValido) {
        res.status(400).json({ errore: "Verifica captcha fallita, riprova." });
        return;
      }

      // 3. Chiamiamo il Caso d'Uso
      const token = await this.loginUseCase.execute({
        email,
        passwordInChiaro: password,
        ipAddress,
      });

      // 4. Rispondiamo con il Token JWT (Status 200 OK)
      res.status(200).json({
        messaggio: "Login effettuato con successo",
        token: token,
      });
    } catch (error) {
      // 5. Gestione errori
      if (error instanceof Error) {
        // Se le credenziali sono errate, il login fallisce con un 401 Unauthorized
        res.status(401).json({ errore: error.message });
      } else {
        res.status(500).json({ errore: "Errore interno del server" });
      }
    }
  };
}
