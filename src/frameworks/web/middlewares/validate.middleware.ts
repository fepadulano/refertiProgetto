import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

// Valida req.body contro uno schema zod PRIMA che la richiesta raggiunga
// il controller (approccio Fail-Fast, vedi tesi 3.5.3): se i dati sono
// malformati, si risponde subito 400 senza mai chiamare il caso d'uso.
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

// Stessa idea, ma per i parametri della query string (es. ?codiceFiscale=...)
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
