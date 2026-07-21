import { Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { NotificaService } from "../../core/services/notifica.service";

@Component({
  selector: "app-registrazione",
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: "./registrazione.component.html",
  styleUrl: "./registrazione.component.css",
})
export class RegistrazioneComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificaService = inject(NotificaService);

  public readonly inCorso = signal(false);
  public readonly registrazioneCompletata = signal(false);

  // Gli stessi vincoli usati dal backend (authValidators.ts), così l'utente
  // vede subito l'errore senza dover aspettare la risposta del server.
  public readonly form = this.formBuilder.nonNullable.group({
    nome: ["", Validators.required],
    cognome: ["", Validators.required],
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(8)]],
    codiceFiscale: [
      "",
      [Validators.required, Validators.minLength(16), Validators.maxLength(16)],
    ],
    dataNascita: ["", Validators.required],
  });

  // Il codice fiscale si scrive per convenzione in maiuscolo: lo trasformiamo
  // mentre l'utente digita, così quello che vede è già quello che verrà salvato.
  public maiuscoloCF(): void {
    const valore = this.form.controls.codiceFiscale.value;
    this.form.controls.codiceFiscale.setValue(valore.toUpperCase(), {
      emitEvent: false,
    });
  }

  public invia(): void {
    if (this.form.invalid) {
      return;
    }

    this.inCorso.set(true);

    this.authService.registrazione(this.form.getRawValue()).subscribe({
      next: () => {
        this.inCorso.set(false);
        this.registrazioneCompletata.set(true);
        setTimeout(() => this.router.navigateByUrl("/login"), 1500);
      },
      error: (errore) => {
        this.inCorso.set(false);
        this.notificaService.errore(
          errore.error?.errore ?? "Errore imprevisto, riprova.",
        );
      },
    });
  }
}
