import { Component, computed, effect, inject, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { saveAs } from "file-saver";
import { RefertiService } from "../../core/services/referti.service";
import { FiltriStorico, Referto } from "../../core/models/referto.models";
import { PaginatorComponent } from "../../shared/paginator/paginator.component";
import { NotificaService } from "../../core/services/notifica.service";
import { NotificheTempoRealeService } from "../../core/services/notifiche-tempo-reale.service";

@Component({
  selector: "app-storico-referti",
  imports: [ReactiveFormsModule, DatePipe, PaginatorComponent],
  templateUrl: "./storico-referti.component.html",
  styleUrl: "./storico-referti.component.css",
})
export class StoricoRefertiComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly refertiService = inject(RefertiService);
  private readonly notificaService = inject(NotificaService);
  private readonly notificheTempoReale = inject(NotificheTempoRealeService);

  private readonly elementiPerPagina = 5;

  public readonly referti = signal<Referto[]>([]);
  public readonly paginaCorrente = signal(1);
  public readonly inCorso = signal(false);

  public readonly numeroPagine = computed(() =>
    Math.max(1, Math.ceil(this.referti().length / this.elementiPerPagina)),
  );

  public readonly refertiPagina = computed(() => {
    const inizio = (this.paginaCorrente() - 1) * this.elementiPerPagina;
    return this.referti().slice(inizio, inizio + this.elementiPerPagina);
  });

  public readonly filtri = this.formBuilder.nonNullable.group({
    categoria: [""],
    dataInizio: [""],
    dataFine: [""],
  });

  constructor() {
    // ricarica al primo avvio e ad ogni nuovo referto in tempo reale
    effect(() => {
      this.notificheTempoReale.refertoCaricato();
      this.cerca();
    });
  }

  public cerca(): void {
    this.inCorso.set(true);

    this.refertiService.storicoProprio(this.leggiFiltri()).subscribe({
      next: (risposta) => {
        this.referti.set(risposta.referti);
        this.paginaCorrente.set(1);
        this.inCorso.set(false);
      },
      error: (errore) => {
        this.inCorso.set(false);
        this.notificaService.errore(
          errore.error?.errore ?? "Errore imprevisto, riprova.",
        );
      },
    });
  }

  public reset(): void {
    this.filtri.reset({ categoria: "", dataInizio: "", dataFine: "" });
    this.cerca();
  }

  public cambiaPagina(nuovaPagina: number): void {
    this.paginaCorrente.set(nuovaPagina);
  }

  public scarica(referto: Referto): void {
    // il server salva il PDF con un nome interno anonimo (UUID), qui ne generiamo uno leggibile
    const data = referto.dataEsame.slice(0, 10); // "YYYY-MM-DD"
    const nomeFile = `referto-${referto.categoria}-${data}.pdf`;

    this.refertiService.download(referto.id).subscribe({
      next: (contenuto) => saveAs(contenuto, nomeFile),
      error: () => this.notificaService.errore("Impossibile scaricare il referto."),
    });
  }

  // esclude i campi vuoti, altrimenti manderemmo al backend "categoria=" invece di ometterla
  private leggiFiltri(): FiltriStorico {
    const valori = this.filtri.getRawValue();
    const filtri: FiltriStorico = {};

    if (valori.categoria) filtri.categoria = valori.categoria;
    if (valori.dataInizio) filtri.dataInizio = valori.dataInizio;
    if (valori.dataFine) filtri.dataFine = valori.dataFine;

    return filtri;
  }
}
