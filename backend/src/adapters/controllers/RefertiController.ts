import { Request, Response } from "express";
import * as path from "path";
import { injectable, inject } from "tsyringe";
import { UploadRefertoUseCase } from "../../use_cases/UploadReferto";
import { DownloadRefertoUseCase } from "../../use_cases/DownloadReferto";
import { AuthRequest } from "../../frameworks/web/middlewares/auth.middleware";
import { gestisciErroreHttp } from "./gestisciErroreHttp";
import { cifraBuffer, decifraBuffer } from "../../frameworks/security/CifratoreFile";
import { notificaPaziente } from "../../frameworks/web/socket";
import { IFileStorage } from "../../use_cases/ports";

// il mimetype dichiarato dal client (controllato da multer) si può falsificare
// facilmente: controlliamo anche l'intestazione reale del file
const INTESTAZIONE_PDF = Buffer.from("%PDF-");

@injectable()
export class RefertiController {
  constructor(
    @inject(UploadRefertoUseCase)
    private uploadRefertoUseCase: UploadRefertoUseCase,
    @inject(DownloadRefertoUseCase)
    private downloadRefertoUseCase: DownloadRefertoUseCase,
    @inject("IFileStorage") private fileStorage: IFileStorage,
  ) {}

  public upload = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const utenteId = req.user?.id;
      if (!utenteId) throw new Error("Utente non autenticato");

      if (!req.file) {
        res.status(400).json({ errore: "Il file PDF è obbligatorio." });
        return;
      }

      if (!req.file.buffer.subarray(0, 5).equals(INTESTAZIONE_PDF)) {
        res.status(400).json({ errore: "Il file non è un PDF valido." });
        return;
      }

      // multer tiene il file in memoria: salviamo solo la versione cifrata
      const percorsoFile = await this.fileStorage.salva(
        cifraBuffer(req.file.buffer),
        path.extname(req.file.originalname),
      );

      const { pazienteId, categoria, dataEsame } = req.body;
      const ipAddress = req.ip || "0.0.0.0";

      const nuovoReferto = await this.uploadRefertoUseCase.execute({
        utenteId,
        pazienteId,
        percorsoFile,
        categoria,
        dataEsame: new Date(dataEsame),
        ipAddress,
      });

      // se il paziente è connesso riceve subito un avviso, altrimenti va persa
      notificaPaziente(nuovoReferto.pazienteId, "referto-caricato", {
        categoria: nuovoReferto.categoria,
        dataEsame: nuovoReferto.dataEsame,
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

      // il file è cifrato: lo leggiamo, lo decifriamo in memoria e lo inviamo
      const bufferCifrato = await this.fileStorage.leggi(percorsoFile);
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
