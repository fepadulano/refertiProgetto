import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { UploadRefertoUseCase } from "../../use_cases/UploadReferto";
import { DownloadRefertoUseCase } from "../../use_cases/DownloadReferto";
import { AuthRequest } from "../../frameworks/web/middlewares/auth.middleware"; // <-- Importa il tipo
import { gestisciErroreHttp } from "./gestisciErroreHttp";

@injectable()
export class RefertiController {
  constructor(
    @inject(UploadRefertoUseCase)
    private uploadRefertoUseCase: UploadRefertoUseCase,
    @inject(DownloadRefertoUseCase)
    private downloadRefertoUseCase: DownloadRefertoUseCase,
  ) {}

  public upload = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const utenteId = req.user?.id;
      if (!utenteId) throw new Error("Utente non autenticato");

      // Il file arriva da multer (multipart/form-data), non più come stringa nel JSON
      if (!req.file) {
        res.status(400).json({ errore: "Il file PDF è obbligatorio." });
        return;
      }

      const { pazienteId, categoria } = req.body;
      const ipAddress = req.ip || "0.0.0.0";

      const nuovoReferto = await this.uploadRefertoUseCase.execute({
        utenteId,
        pazienteId,
        percorsoFile: req.file.path,
        categoria,
        ipAddress,
      });

      res.status(201).json({
        messaggio: "Referto caricato con successo",
        referto: nuovoReferto,
      });
    } catch (error) {
      gestisciErroreHttp(error, res);
    }
  };

  public download = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const refertoId = req.params.id as string;

      const utenteId = req.user?.id;
      if (!utenteId) throw new Error("Utente non autenticato");

      const ipAddress = req.ip || "0.0.0.0";

      const percorsoFile = await this.downloadRefertoUseCase.execute({
        utenteId,
        refertoId,
        ipAddress,
      });

      res.download(percorsoFile);
    } catch (error) {
      gestisciErroreHttp(error, res);
    }
  };
}
