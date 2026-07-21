import { Component, computed, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { AdminService } from "../../core/services/admin.service";
import { MedicoElenco } from "../../core/models/medico.models";
import { PaginatorComponent } from "../../shared/paginator/paginator.component";
import { NotificaService } from "../../core/services/notifica.service";

@Component({
  selector: "app-gestione-medici",
  imports: [ReactiveFormsModule, PaginatorComponent],
  templateUrl: "./gestione-medici.component.html",
  styleUrl: "./gestione-medici.component.css",
})
export class GestioneMediciComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly notificaService = inject(NotificaService);

  private readonly elementiPerPagina = 5;

  public readonly medici = signal<MedicoElenco[]>([]);
  public readonly paginaCorrente = signal(1);
  public readonly caricamento = signal(false);
  public readonly creazioneInCorso = signal(false);
  public readonly medicoInDisabilitazione = signal<string | null>(null);

  public readonly formNuovoMedico = this.formBuilder.nonNullable.group({
    nome: ["", Validators.required],
    cognome: ["", Validators.required],
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(8)]],
    specializzazione: ["", Validators.required],
    numeroMatricola: ["", Validators.required],
  });

  // Numero totale di pagine (almeno 1, anche a lista vuota)
  public readonly numeroPagine = computed(() =>
    Math.max(1, Math.ceil(this.medici().length / this.elementiPerPagina)),
  );

  // Solo i medici della pagina corrente, quelli da mostrare in tabella
  public readonly mediciPagina = computed(() => {
    const inizio = (this.paginaCorrente() - 1) * this.elementiPerPagina;
    return this.medici().slice(inizio, inizio + this.elementiPerPagina);
  });

  constructor() {
    this.caricaElenco();
  }

  public caricaElenco(): void {
    this.caricamento.set(true);

    this.adminService.elencoMedici().subscribe({
      next: (risposta) => {
        this.medici.set(risposta.medici);
        this.paginaCorrente.set(1);
        this.caricamento.set(false);
      },
      error: (errore) => {
        this.caricamento.set(false);
        this.notificaService.errore(
          errore.error?.errore ?? "Errore imprevisto, riprova.",
        );
      },
    });
  }

  public cambiaPagina(nuovaPagina: number): void {
    this.paginaCorrente.set(nuovaPagina);
  }

  public creaMedico(): void {
    if (this.formNuovoMedico.invalid) {
      return;
    }

    this.creazioneInCorso.set(true);

    this.adminService.creaMedico(this.formNuovoMedico.getRawValue()).subscribe({
      next: () => {
        this.creazioneInCorso.set(false);
        this.notificaService.successo("Account medico creato con successo.");
        this.formNuovoMedico.reset({
          nome: "",
          cognome: "",
          email: "",
          password: "",
          specializzazione: "",
          numeroMatricola: "",
        });
        this.caricaElenco();
      },
      error: (errore) => {
        this.creazioneInCorso.set(false);
        this.notificaService.errore(
          errore.error?.errore ?? "Errore imprevisto, riprova.",
        );
      },
    });
  }

  public disabilita(medico: MedicoElenco): void {
    const confermato = confirm(
      `Disabilitare l'accesso di ${medico.nome} ${medico.cognome}? Non potrà più effettuare il login.`,
    );
    if (!confermato) {
      return;
    }

    this.medicoInDisabilitazione.set(medico.utenteId);

    this.adminService.disabilitaMedico(medico.utenteId).subscribe({
      next: () => {
        this.medicoInDisabilitazione.set(null);
        this.notificaService.successo("Medico disabilitato.");
        this.caricaElenco();
      },
      error: (errore) => {
        this.medicoInDisabilitazione.set(null);
        this.notificaService.errore(
          errore.error?.errore ?? "Errore imprevisto, riprova.",
        );
      },
    });
  }
}
