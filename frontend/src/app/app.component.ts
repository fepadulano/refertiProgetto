import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificheComponent } from './shared/notifiche/notifiche.component';
import { NotificheTempoRealeService } from './core/services/notifiche-tempo-reale.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificheComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';

  // L'iniezione qui basta ad "attivare" il servizio (provideIn: root, ma
  // creato solo alla prima iniezione): da questo momento resta in ascolto
  // per tutta la vita dell'app, indipendentemente dalla pagina visitata.
  private readonly notificheTempoReale = inject(NotificheTempoRealeService);
}
