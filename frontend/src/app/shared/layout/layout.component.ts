import { Component, inject } from "@angular/core";
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { RuoloUtente } from "../../core/models/ruolo-utente";

// Layout condiviso da tutte le pagine dell'area riservata: la navbar resta
// fissa in cima e cambia solo il contenuto sotto (router-outlet), invece di
// essere ridisegnata da ogni singola pagina.
@Component({
  selector: "app-layout",
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: "./layout.component.html",
  styleUrl: "./layout.component.css",
})
export class LayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  public readonly RuoloUtente = RuoloUtente;
  public readonly utenteCorrente = this.authService.utenteCorrente;

  public logout(): void {
    this.authService.logout();
    this.router.navigateByUrl("/login");
  }
}
