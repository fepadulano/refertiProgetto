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

  // l'iniezione basta ad attivare il servizio, che resta in ascolto per tutta l'app
  private readonly notificheTempoReale = inject(NotificheTempoRealeService);
}
