import { Response } from "express";
import { ErroreAutorizzazione } from "../../use_cases/erroriDominio";

// mappa gli errori dei use case sempre allo stesso codice HTTP, in ogni controller
export function gestisciErroreHttp(error: unknown, res: Response): void {
  if (error instanceof ErroreAutorizzazione) {
    res.status(403).json({ errore: error.message });
  } else if (error instanceof Error) {
    res.status(400).json({ errore: error.message });
  } else {
    res.status(500).json({ errore: "Errore interno del server" });
  }
}
