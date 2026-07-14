import { Router } from "express";
import { PazientiController } from "../../../adapters/controllers/PazientiController";
import { container } from "tsyringe";
import { abilitaProtezioneJwt } from "../middlewares/auth.middleware";
import { validaQuery } from "../middlewares/validate.middleware";
import {
  ricercaPazienteQuerySchema,
  listaRefertiQuerySchema,
} from "../../../adapters/validators/pazientiValidators";

export const pazientiRouter = Router();

const pazientiController = container.resolve(PazientiController);

// GET /api/pazienti?codiceFiscale=... (RF3, solo Medico)
pazientiRouter.get(
  "/",
  abilitaProtezioneJwt,
  validaQuery(ricercaPazienteQuerySchema),
  pazientiController.cerca,
);

// GET /api/pazienti/:id/referti?categoria=...&dataInizio=...&dataFine=... (RF5/RF7)
pazientiRouter.get(
  "/:id/referti",
  abilitaProtezioneJwt,
  validaQuery(listaRefertiQuerySchema),
  pazientiController.listaReferti,
);
