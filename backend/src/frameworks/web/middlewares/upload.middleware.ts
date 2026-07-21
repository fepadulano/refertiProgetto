import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { env } from "../../config/env";

// Ci assicuriamo che la cartella di destinazione esista prima che multer provi a scriverci dentro
fs.mkdirSync(env.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.uploadDir);
  },
  filename: (_req, file, cb) => {
    // Nome fisico univoco sul disco: evita collisioni e non espone il nome originale del file
    const nomeUnivoco = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
    cb(null, nomeUnivoco);
  },
});

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

export const uploadPdf = multer({
  storage,
  fileFilter: filtroSoloPdf,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});
