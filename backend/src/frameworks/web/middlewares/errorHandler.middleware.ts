import { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";

// deve avere esattamente 4 parametri perché Express lo riconosca come error handler
export function gestoreErrori(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof MulterError) {
    res.status(400).json({ errore: `Errore upload: ${err.message}` });
    return;
  }

  if (err instanceof Error) {
    res.status(400).json({ errore: err.message });
    return;
  }

  res.status(500).json({ errore: "Errore interno del server" });
}
