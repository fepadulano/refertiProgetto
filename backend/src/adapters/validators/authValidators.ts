import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(1, "La password è obbligatoria"),
  captchaToken: z.string().min(1, "Verifica captcha obbligatoria"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Il refresh token è obbligatorio"),
});

export const cambiaPasswordSchema = z.object({
  passwordAttuale: z.string().min(1, "La password attuale è obbligatoria"),
  nuovaPassword: z.string().min(8, "La nuova password deve avere almeno 8 caratteri"),
});
