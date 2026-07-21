import { Router } from "express";
import { AdminController } from "../../../adapters/controllers/AdminController";
import { container } from "tsyringe";
import { abilitaProtezioneJwt } from "../middlewares/auth.middleware";
import { validaBody } from "../middlewares/validate.middleware";
import { creaMedicoSchema } from "../../../adapters/validators/adminValidators";

export const adminRouter = Router();

const adminController = container.resolve(AdminController);

adminRouter.post(
  "/crea-medico",
  abilitaProtezioneJwt,
  validaBody(creaMedicoSchema),
  adminController.creaMedico,
);

adminRouter.post(
  "/medici/:id/disabilita",
  abilitaProtezioneJwt,
  adminController.disabilitaMedico,
);

adminRouter.get("/medici", abilitaProtezioneJwt, adminController.elencoMedici);
