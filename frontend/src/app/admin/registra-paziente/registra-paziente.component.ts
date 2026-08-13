import { Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { AdminService } from "../../core/services/admin.service";
import { NotificaService } from "../../core/services/notifica.service";

// RF9: l'account Paziente non si autoregistra più. È l'Admin (segreteria/
// accettazione) a crearlo, dopo aver verificato di persona un documento
// d'identità e il codice fiscale — altrimenti chiunque potrebbe dichiarare
// il CF di un'altra persona reale, dato che in Italia non è un segreto.
@Component({
  selector: "app-registra-paziente",
  imports: [ReactiveFormsModule],
  templateUrl: "./registra-paziente.component.html",
  styleUrl: "./registra-paziente.component.css",
})
export class RegistraPazienteComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly notificaService = inject(NotificaService);

  public readonly inCorso = signal(false);

  // stessi vincoli usati dal backend (pazientiValidators.ts)
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

  // trasformato mentre l'utente digita, per convenzione del CF italiano
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

    this.adminService.creaPaziente(this.form.getRawValue()).subscribe({
      next: () => {
        this.inCorso.set(false);
        this.notificaService.successo("Account Paziente creato con successo.");
        this.form.reset();
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
