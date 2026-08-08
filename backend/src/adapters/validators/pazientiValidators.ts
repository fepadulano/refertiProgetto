import { z } from "zod";
import { CategoriaReferto } from "../../entities/Referto";

export const ricercaPazienteQuerySchema = z.object({
  codiceFiscale: z
    .string()
    .length(16, "Il codice fiscale deve avere 16 caratteri"),
});

export const listaRefertiQuerySchema = z.object({
  categoria: z.nativeEnum(CategoriaReferto, { message: "Categoria non valida" }).optional(),
  dataInizio: z.string().optional(),
  dataFine: z.string().optional(),
});
