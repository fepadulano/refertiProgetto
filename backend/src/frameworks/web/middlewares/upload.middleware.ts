import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

function filtroSoloPdf(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  if (file.mimetype !== "application/pdf") {
    cb(new Error("Formato non valido: è consentito solo il caricamento di file PDF."));
    return;
  }
  cb(null, true);
}

// memoryStorage: il file resta in RAM, sarà il controller a scriverlo cifrato
export const caricaPdf = multer({
  storage: multer.memoryStorage(),
  fileFilter: filtroSoloPdf,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});
