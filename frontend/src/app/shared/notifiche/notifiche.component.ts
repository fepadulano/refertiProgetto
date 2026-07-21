import { Component, inject } from "@angular/core";
import { NotificaService } from "../../core/services/notifica.service";

@Component({
  selector: "app-notifiche",
  imports: [],
  templateUrl: "./notifiche.component.html",
  styleUrl: "./notifiche.component.css",
})
export class NotificheComponent {
  private readonly notificaService = inject(NotificaService);

  public readonly notifiche = this.notificaService.notifiche;

  public chiudi(id: number): void {
    this.notificaService.rimuovi(id);
  }
}
