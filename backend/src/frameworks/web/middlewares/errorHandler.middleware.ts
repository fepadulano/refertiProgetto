import { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";

// Middleware d'errore Express: deve avere esattamente 4 parametri perché
// Express lo riconosca come error handler (vedi RNF/3.4.3: 500 come catch-all
// che non espone mai lo stack trace al client).
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
