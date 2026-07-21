import { Router } from "express";
import { RefertiController } from "../../../adapters/controllers/RefertiController";
import { container } from "tsyringe";
import { abilitaProtezioneJwt } from "../middlewares/auth.middleware";
import { uploadPdf } from "../middlewares/upload.middleware";
import { validaBody } from "../middlewares/validate.middleware";
import { uploadRefertoSchema } from "../../../adapters/validators/refertiValidators";

export const refertiRouter = Router();

const refertiController = container.resolve(RefertiController);

refertiRouter.post(
  "/",
  abilitaProtezioneJwt,
  uploadPdf.single("file"),
  validaBody(uploadRefertoSchema),
  refertiController.upload,
);
refertiRouter.get(
  "/:id/download",
  abilitaProtezioneJwt,
  refertiController.download,
);
