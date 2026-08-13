import { Component, inject, signal } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { NotificaService } from "../../core/services/notifica.service";

// RF2/RF9: chi riceve un account con una password scelta da un Admin deve
// sostituirla prima di poter usare il sistema (Sezione 4.1.10). Questa
// pagina non ha vie d'uscita: niente link per tornare indietro.
@Component({
  selector: "app-cambia-password",
  imports: [ReactiveFormsModule],
  templateUrl: "./cambia-password.component.html",
  styleUrl: "./cambia-password.component.css",
})
export class CambiaPasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notificaService = inject(NotificaService);
  private readonly router = inject(Router);

  public readonly inCorso = signal(false);

  public readonly form = this.formBuilder.nonNullable.group(
    {
      passwordAttuale: ["", Validators.required],
      nuovaPassword: ["", [Validators.required, Validators.minLength(8)]],
      confermaPassword: ["", Validators.required],
    },
    { validators: [passwordCoincidentiValidator] },
  );

  public invia(): void {
    if (this.form.invalid) {
      return;
    }

    this.inCorso.set(true);

    const { passwordAttuale, nuovaPassword } = this.form.getRawValue();
    this.authService.cambiaPassword({ passwordAttuale, nuovaPassword }).subscribe({
      next: () => {
        this.inCorso.set(false);
        this.notificaService.successo("Password aggiornata con successo.");
        this.router.navigateByUrl("/");
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

function passwordCoincidentiValidator(
  gruppo: AbstractControl,
): ValidationErrors | null {
  const nuova = gruppo.get("nuovaPassword")?.value;
  const conferma = gruppo.get("confermaPassword")?.value;
  return nuova === conferma ? null : { passwordDiverse: true };
}
