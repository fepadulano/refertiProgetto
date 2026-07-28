import { Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { injectable, inject } from "tsyringe";
import { UploadRefertoUseCase } from "../../use_cases/UploadReferto";
import { DownloadRefertoUseCase } from "../../use_cases/DownloadReferto";
import { AuthRequest } from "../../frameworks/web/middlewares/auth.middleware";
import { gestisciErroreHttp } from "./gestisciErroreHttp";
import { cifraBuffer, decifraBuffer } from "../../frameworks/security/CifratoreFile";
import { notificaPaziente } from "../../frameworks/web/socket";
import { env } from "../../frameworks/config/env";

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

      if (!req.file) {
        res.status(400).json({ errore: "Il file PDF è obbligatorio." });
        return;
      }

      // multer tiene il file in memoria: scriviamo su disco solo la versione cifrata
      const nomeFile = `${crypto.randomUUID()}${path.extname(req.file.originalname)}`;
      const percorsoFile = path.join(env.uploadDir, nomeFile);
      fs.writeFileSync(percorsoFile, cifraBuffer(req.file.buffer));

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

      // niente res.download(): il file su disco è cifrato, va decifrato prima
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
