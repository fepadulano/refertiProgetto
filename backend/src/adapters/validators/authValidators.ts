import { z } from "zod";

export const registrazionePazienteSchema = z.object({
  nome: z.string().min(1, "Il nome è obbligatorio"),
  cognome: z.string().min(1, "Il cognome è obbligatorio"),
  email: z.string().email("Email non valida"),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri"),
  codiceFiscale: z
    .string()
    .length(16, "Il codice fiscale deve avere 16 caratteri"),
  dataNascita: z.string().min(1, "La data di nascita è obbligatoria"),
});

export const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(1, "La password è obbligatoria"),
  captchaToken: z.string().min(1, "Verifica captcha obbligatoria"),
});
