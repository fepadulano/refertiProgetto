// Corpo della risposta di GET /api/pazienti?codiceFiscale=...
export interface PazienteTrovato {
  pazienteId: string;
  utenteId: string;
  nome: string;
  cognome: string;
  codiceFiscale: string;
  dataNascita: string;
}
