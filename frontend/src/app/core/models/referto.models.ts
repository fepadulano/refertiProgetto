// Corrisponde all'entità Referto del backend (vedi backend/src/entities/Referto.ts)
export interface Referto {
  id: string;
  medicoId: string;
  pazienteId: string;
  categoria: string;
  dataEsame: string;
  dataCaricamento: string;
}

// Filtri opzionali per GET /api/pazienti/me/referti
export interface FiltriStorico {
  categoria?: string;
  dataInizio?: string; // formato "YYYY-MM-DD"
  dataFine?: string; // formato "YYYY-MM-DD"
}

// Corpo della risposta di GET /api/pazienti/me/referti
export interface StoricoRefertiResponse {
  referti: Referto[];
}

// Corpo della risposta di POST /api/referti
export interface UploadRefertoResponse {
  messaggio: string;
  referto: Referto;
}
