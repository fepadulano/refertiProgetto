import { Injectable, signal } from "@angular/core";

export type TipoNotifica = "successo" | "errore";

export interface Notifica {
  id: number;
  tipo: TipoNotifica;
  messaggio: string;
}

const DURATA_MS = 5000;

// elenco condiviso di notifiche "toast", mostrate tutte da NotificheComponent
@Injectable({ providedIn: "root" })
export class NotificaService {
  private readonly prossimoId = signal(1);
  public readonly notifiche = signal<Notifica[]>([]);

  public successo(messaggio: string): void {
    this.aggiungi("successo", messaggio);
  }

  public errore(messaggio: string): void {
    this.aggiungi("errore", messaggio);
  }

  public rimuovi(id: number): void {
    this.notifiche.update((elenco) => elenco.filter((n) => n.id !== id));
  }

  private aggiungi(tipo: TipoNotifica, messaggio: string): void {
    const id = this.prossimoId();
    this.prossimoId.set(id + 1);
    this.notifiche.update((elenco) => [...elenco, { id, tipo, messaggio }]);
    setTimeout(() => this.rimuovi(id), DURATA_MS);
  }
}
