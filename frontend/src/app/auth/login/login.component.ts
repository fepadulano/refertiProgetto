import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificaService } from '../../core/services/notifica.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificaService = inject(NotificaService);

  public readonly inCorso = signal(false);

  public readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  public invia(): void {
    if (this.form.invalid) {
      return;
    }

    this.inCorso.set(true);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.inCorso.set(false);
        this.router.navigateByUrl('/');
      },
      error: (errore) => {
        this.inCorso.set(false);
        this.notificaService.errore(
          errore.error?.errore ?? 'Errore imprevisto, riprova.',
        );
      },
    });
  }
}
