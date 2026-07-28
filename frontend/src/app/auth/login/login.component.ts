import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificaService } from '../../core/services/notifica.service';
import { environment } from '../../../environments/environment';

// variabile globale creata dallo script di Google in index.html, non un modulo npm
declare const grecaptcha: {
  render(container: HTMLElement, parametri: { sitekey: string }): void;
  getResponse(): string;
  reset(): void;
};

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements AfterViewInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificaService = inject(NotificaService);

  @ViewChild('recaptchaContainer')
  private recaptchaContainer!: ElementRef<HTMLDivElement>;

  public readonly siteKey = environment.recaptchaSiteKey;
  public readonly inCorso = signal(false);

  public readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  // il div esiste già, ma lo script async di Google potrebbe non esserlo ancora
  public ngAfterViewInit(): void {
    const intervallo = setInterval(() => {
      if (typeof grecaptcha === 'undefined') {
        return;
      }
      clearInterval(intervallo);
      grecaptcha.render(this.recaptchaContainer.nativeElement, {
        sitekey: this.siteKey,
      });
    }, 100);
  }

  public invia(): void {
    if (this.form.invalid) {
      return;
    }

    const captchaToken = grecaptcha.getResponse();
    if (!captchaToken) {
      this.notificaService.errore('Completa la verifica captcha prima di continuare.');
      return;
    }

    this.inCorso.set(true);

    this.authService.login({ ...this.form.getRawValue(), captchaToken }).subscribe({
      next: () => {
        this.inCorso.set(false);
        this.router.navigateByUrl('/');
      },
      error: (errore) => {
        this.inCorso.set(false);
        grecaptcha.reset();
        this.notificaService.errore(
          errore.error?.errore ?? 'Errore imprevisto, riprova.',
        );
      },
    });
  }
}
