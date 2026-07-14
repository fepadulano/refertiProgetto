// Errore lanciato dai use case quando un utente autenticato non ha i permessi
// per compiere l'azione richiesta. Gli Interface Adapters (i controller) lo
// riconoscono per mapparlo sempre allo stesso codice HTTP (403 Forbidden),
// distinguendolo dagli altri errori di validazione/logica (400 Bad Request).
export class ErroreAutorizzazione extends Error {}
