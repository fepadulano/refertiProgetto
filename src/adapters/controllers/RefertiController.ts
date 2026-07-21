import { Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";
import { injectable, inject } from "tsyringe";
import { UploadRefertoUseCase } from "../../use_cases/UploadReferto";
import { DownloadRefertoUseCase } from "../../use_cases/DownloadReferto";
import { AuthRequest } from "../../frameworks/web/middlewares/auth.middleware"; // <-- Importa il tipo
import { gestisciErroreHttp } from "./gestisciErroreHttp";
import { cifraBuffer, decifraBuffer } from "../../frameworks/security/CifratoreFile";

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

      // Multer ha già scritto il PDF in chiaro sul disco: lo cifriamo subito
      // dopo, sovrascrivendolo. Da qui in poi (use case, repository, DB) tutto
      // continua a lavorare solo con il percorso del file, senza sapere che
      // il contenuto è cifrato.
      const bufferInChiaro = fs.readFileSync(req.file.path);
      fs.writeFileSync(req.file.path, cifraBuffer(bufferInChiaro));

      const { pazienteId, categoria, dataEsame } = req.body;
      const ipAddress = req.ip || "0.0.0.0";

      const nuovoReferto = await this.uploadRefertoUseCase.execute({
        utenteId,
        pazienteId,
        percorsoFile: req.file.path,
        categoria,
        dataEsame: new Date(dataEsame),
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

      // Il file su disco è cifrato: lo leggiamo, lo decifriamo in memoria e lo
      // inviamo. Non possiamo usare res.download() perché legge direttamente
      // i byte grezzi dal disco (che qui sono cifrati, non un PDF valido).
      const bufferCifrato = fs.readFileSync(percorsoFile);
      const bufferInChiaro = decifraBuffer(bufferCifrato);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${path.basename(percorsoFile)}"`,
      );
      res.send(bufferInChiaro);
    } catch (error) {
      gestisciErroreHttp(error, res);
    }
  };
}
