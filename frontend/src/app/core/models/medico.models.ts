// Corrisponde a MedicoElenco del backend (vedi backend/src/use_cases/ElencoMedici.ts)
export interface MedicoElenco {
  utenteId: string;
  medicoId: string;
  nome: string;
  cognome: string;
  email: string;
  specializzazione: string;
  numeroMatricola: string;
  attivo: boolean;
}

// Corpo della risposta di GET /api/admin/medici
export interface ElencoMediciResponse {
  medici: MedicoElenco[];
}

// Corpo della richiesta POST /api/admin/crea-medico
export interface CreaMedicoRequest {
  nome: string;
  cognome: string;
  email: string;
  password: string;
  specializzazione: string;
  numeroMatricola: string;
}

// Corpo della risposta di POST /api/admin/crea-medico
export interface CreaMedicoResponse {
  messaggio: string;
  medicoId: string;
}
