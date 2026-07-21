import { Response } from "express";
import { ErroreAutorizzazione } from "../../use_cases/erroriDominio";

// Traduce un errore lanciato da un use case nella risposta HTTP corretta,
// con lo stesso comportamento in tutti i controller:
// - permessi insufficienti (ErroreAutorizzazione)      -> 403 Forbidden
// - altri errori di validazione/logica (Error generico) -> 400 Bad Request
// - qualunque altra cosa imprevista                     -> 500 Internal Server Error
export function gestisciErroreHttp(error: unknown, res: Response): void {
  if (error instanceof ErroreAutorizzazione) {
    res.status(403).json({ errore: error.message });
  } else if (error instanceof Error) {
    res.status(400).json({ errore: error.message });
  } else {
    res.status(500).json({ errore: "Errore interno del server" });
  }
}
