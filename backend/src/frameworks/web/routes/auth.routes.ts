import { Router } from "express";
import { container } from "../../../container";
import { AuthController } from "../../../adapters/controllers/AuthController";
import { validaBody } from "../middlewares/validate.middleware";
import { limitatoreAuth } from "../middlewares/rateLimit.middleware";
import { abilitaProtezioneJwt } from "../middlewares/auth.middleware";
import {
  loginSchema,
  refreshTokenSchema,
  cambiaPasswordSchema,
} from "../../../adapters/validators/authValidators";

export const authRouter = Router();

const authController = container.resolve(AuthController);

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
authRouter.post(
  "/cambia-password",
  abilitaProtezioneJwt,
  validaBody(cambiaPasswordSchema),
  authController.cambiaPassword,
);
