import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { saveAs } from "file-saver";
import { Chart, registerables } from "chart.js";
import { RefertiService } from "../../core/services/referti.service";
import { FiltriStorico, Referto } from "../../core/models/referto.models";
import { PaginatorComponent } from "../../shared/paginator/paginator.component";
import { NotificaService } from "../../core/services/notifica.service";

Chart.register(...registerables);

@Component({
  selector: "app-storico-referti",
  imports: [ReactiveFormsModule, DatePipe, PaginatorComponent],
  templateUrl: "./storico-referti.component.html",
  styleUrl: "./storico-referti.component.css",
})
export class StoricoRefertiComponent implements OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly refertiService = inject(RefertiService);
  private readonly notificaService = inject(NotificaService);

  @ViewChild("grafico") private canvasGrafico?: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

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
    this.cerca();

    // Il grafico va ridisegnato ogni volta che cambia la lista dei referti
    // (nuova ricerca), non quando cambia solo la pagina visualizzata.
    effect(() => {
      this.aggiornaGrafico(this.referti());
    });
  }

  public ngOnDestroy(): void {
    this.chart?.destroy();
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
    // Il server salva il PDF con un nome interno anonimo (un UUID): qui ne
    // generiamo uno leggibile per l'utente, invece di usare quello del server.
    const data = referto.dataEsame.slice(0, 10); // "YYYY-MM-DD"
    const nomeFile = `referto-${referto.categoria}-${data}.pdf`;

    this.refertiService.download(referto.id).subscribe({
      next: (contenuto) => saveAs(contenuto, nomeFile),
      error: () => this.notificaService.errore("Impossibile scaricare il referto."),
    });
  }

  // Raggruppa i referti per categoria e li mostra come grafico a barre.
  // Il canvas esiste solo quando ci sono referti da mostrare (vedi template),
  // quindi finché non arrivano dati non c'è nulla da disegnare.
  private aggiornaGrafico(referti: Referto[]): void {
    const canvas = this.canvasGrafico?.nativeElement;
    this.chart?.destroy();
    if (!canvas || referti.length === 0) {
      return;
    }

    const conteggiPerCategoria = new Map<string, number>();
    for (const referto of referti) {
      conteggiPerCategoria.set(
        referto.categoria,
        (conteggiPerCategoria.get(referto.categoria) ?? 0) + 1,
      );
    }

    this.chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: [...conteggiPerCategoria.keys()],
        datasets: [
          {
            label: "Referti",
            data: [...conteggiPerCategoria.values()],
            backgroundColor: "#2c3e50",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    });
  }

  // Estrae il valore dei filtri, escludendo i campi lasciati vuoti
  // (altrimenti manderemmo al backend "categoria=" invece di ometterla)
  private leggiFiltri(): FiltriStorico {
    const valori = this.filtri.getRawValue();
    const filtri: FiltriStorico = {};

    if (valori.categoria) filtri.categoria = valori.categoria;
    if (valori.dataInizio) filtri.dataInizio = valori.dataInizio;
    if (valori.dataFine) filtri.dataFine = valori.dataFine;

    return filtri;
  }
}
