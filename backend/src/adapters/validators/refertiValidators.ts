import { z } from "zod";
import { CategoriaReferto } from "../../entities/Referto";

// Il file PDF viene validato a parte da multer (upload.middleware.ts):
// qui controlliamo solo i campi di testo che arrivano insieme al file.
export const uploadRefertoSchema = z.object({
  pazienteId: z.string().min(1, "Il pazienteId è obbligatorio"),
  categoria: z.nativeEnum(CategoriaReferto, {
    message: "Categoria non valida",
  }),
  dataEsame: z.string().min(1, "La data dell'esame è obbligatoria"),
});
