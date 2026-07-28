// Enum per evitare errori di battitura nel DB
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
    public readonly utenteId: string, // chi ha fatto l'azione
    public readonly tipoAzione: TipoAzione,
    public readonly ipAddress: string, // per compliance GDPR
    public readonly refertoId: string | null = null,
    public readonly timestamp: Date = new Date(),
  ) {}

  // Immutabile: una volta creato, un log non si modifica più.
}
