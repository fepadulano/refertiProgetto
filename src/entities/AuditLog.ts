// Creiamo un Enum per bloccare rigidamente le azioni possibili (evita errori di battitura nel DB)
export enum TipoAzione {
  REGISTRAZIONE_UTENTE = "REGISTRAZIONE_UTENTE",
  LOGIN_EFFETTUATO = "LOGIN_EFFETTUATO",
  LOGIN_FALLITO = "LOGIN_FALLITO",
  UPLOAD_REFERTO = "UPLOAD_REFERTO",
  DOWNLOAD_REFERTO = "DOWNLOAD_REFERTO",
  ACCESSO_NEGATO = "ACCESSO_NEGATO",
  DISABILITAZIONE_MEDICO = "DISABILITAZIONE_MEDICO",
}

export class AuditLog {
  constructor(
    public readonly id: string,
    public readonly utenteId: string, // Chi ha fatto l'azione (il login)
    public readonly tipoAzione: TipoAzione,
    public readonly ipAddress: string, // Tracciamo l'indirizzo IP per la compliance ISO/GDPR,
    // è la stringa che rappresenta l'indirizzo IP pubblico del dispositivo che sta effettuando l'operazione

    public readonly refertoId: string | null = null,

    public readonly timestamp: Date = new Date(),
  ) {}

  // Questa classe NON ha metodi per modificare i dati.
  // Una volta istanziato, un log non può MAI essere alterato.
}
