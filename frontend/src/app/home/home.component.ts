import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuthService } from "../core/services/auth.service";
import { RuoloUtente } from "../core/models/ruolo-utente";

@Component({
  selector: "app-home",
  imports: [RouterLink],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.css",
})
export class HomeComponent {
  private readonly authService = inject(AuthService);

  // Esposto al template, che non può leggere un import direttamente
  public readonly RuoloUtente = RuoloUtente;

  // Segnale pubblico letto direttamente dal template
  public readonly utenteCorrente = this.authService.utenteCorrente;
}
