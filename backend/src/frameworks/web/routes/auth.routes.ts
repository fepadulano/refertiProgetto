import { Router } from "express";
import { container } from "../../../container";
import { AuthController } from "../../../adapters/controllers/AuthController";
import { validaBody } from "../middlewares/validate.middleware";
import { limitatoreAuth } from "../middlewares/rateLimit.middleware";
import {
  registrazionePazienteSchema,
  loginSchema,
  refreshTokenSchema,
} from "../../../adapters/validators/authValidators";

export const authRouter = Router();

const authController = container.resolve(AuthController);

authRouter.post(
  "/registrazione-paziente",
  validaBody(registrazionePazienteSchema),
  authController.registraPaziente,
);
authRouter.post(
  "/login",
  limitatoreAuth,
  validaBody(loginSchema),
  authController.login,
);
authRouter.post(
  "/refresh",
  limitatoreAuth,
  validaBody(refreshTokenSchema),
  authController.refresh,
);
