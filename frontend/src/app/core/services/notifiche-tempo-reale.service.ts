import { Injectable, effect, inject, signal } from "@angular/core";
import { io, Socket } from "socket.io-client";
import { AuthService } from "./auth.service";
import { NotificaService } from "./notifica.service";
import { environment } from "../../../environments/environment";

interface EventoRefertoCaricato {
  categoria: string;
  dataEsame: string;
}

// Tiene aperta una connessione WebSocket verso il backend finché c'è un
// utente loggato, per ricevere avvisi push (es. "nuovo referto caricato")
// senza dover ricaricare la pagina o interrogare periodicamente il server.
@Injectable({ providedIn: "root" })
export class NotificheTempoRealeService {
  private readonly authService = inject(AuthService);
  private readonly notificaService = inject(NotificaService);

  private socket?: Socket;

  // Non serve il contenuto dell'evento, solo "sapere che è arrivato": un
  // numero che sale ad ogni referto caricato basta a far scattare chi vi
  // si iscrive (es. StoricoRefertiComponent, per ricaricare la lista).
  public readonly refertoCaricato = signal(0);

  constructor() {
    effect(() => {
      const utente = this.authService.utenteCorrente();
      if (utente) {
        this.connetti();
      } else {
        this.disconnetti();
      }
    });
  }

  private connetti(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(environment.socketUrl, {
      auth: { token: this.authService.getToken() },
    });

    this.socket.on("referto-caricato", (dati: EventoRefertoCaricato) => {
      const data = dati.dataEsame.slice(0, 10); // "YYYY-MM-DD"
      this.notificaService.successo(
        `Nuovo referto disponibile: ${dati.categoria} (${data})`,
      );
      this.refertoCaricato.update((n) => n + 1);
    });
  }

  private disconnetti(): void {
    this.socket?.disconnect();
    this.socket = undefined;
  }
}
