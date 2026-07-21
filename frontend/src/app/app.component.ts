import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificheComponent } from './shared/notifiche/notifiche.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificheComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
}
