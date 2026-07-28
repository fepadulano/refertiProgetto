import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

// valida req.body prima che la richiesta raggiunga il controller (fail-fast)
export function validaBody(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const risultato = schema.safeParse(req.body);

    if (!risultato.success) {
      res.status(400).json({ errore: risultato.error.issues[0].message });
      return;
    }

    req.body = risultato.data;
    next();
  };
}

// stessa idea, ma per la query string (es. ?codiceFiscale=...)
export function validaQuery(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const risultato = schema.safeParse(req.query);

    if (!risultato.success) {
      res.status(400).json({ errore: risultato.error.issues[0].message });
      return;
    }

    next();
  };
}
