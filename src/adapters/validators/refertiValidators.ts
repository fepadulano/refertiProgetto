import { z } from "zod";

// Il file PDF viene validato a parte da multer (upload.middleware.ts):
// qui controlliamo solo i campi di testo che arrivano insieme al file.
export const uploadRefertoSchema = z.object({
  pazienteId: z.string().min(1, "Il pazienteId è obbligatorio"),
  categoria: z.string().min(1, "La categoria è obbligatoria"),
});
