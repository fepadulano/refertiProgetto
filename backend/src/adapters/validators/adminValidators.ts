import { z } from "zod";

export const creaMedicoSchema = z.object({
  nome: z.string().min(1, "Il nome è obbligatorio"),
  cognome: z.string().min(1, "Il cognome è obbligatorio"),
  email: z.string().email("Email non valida"),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri"),
  specializzazione: z.string().min(1, "La specializzazione è obbligatoria"),
  numeroMatricola: z.string().min(1, "Il numero di matricola è obbligatorio"),
});
