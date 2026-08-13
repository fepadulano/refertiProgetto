// Corpo della risposta di GET /api/pazienti?codiceFiscale=...
export interface PazienteTrovato {
  pazienteId: string;
  utenteId: string;
  nome: string;
  cognome: string;
  codiceFiscale: string;
  dataNascita: string;
}

// Corpo della richiesta POST /api/admin/crea-paziente (RF9, solo Admin)
export interface CreaPazienteRequest {
  nome: string;
  cognome: string;
  email: string;
  password: string;
  codiceFiscale: string;
  dataNascita: string; // formato "YYYY-MM-DD"
}

// Corpo della risposta di POST /api/admin/crea-paziente (201 Created)
export interface CreaPazienteResponse {
  messaggio: string;
  pazienteId: string;
}
