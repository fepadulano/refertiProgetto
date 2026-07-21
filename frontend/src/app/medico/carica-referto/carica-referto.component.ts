import {
  Component,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  of,
  switchMap,
} from 'rxjs';
import { PazientiService } from '../../core/services/pazienti.service';
import { RefertiService } from '../../core/services/referti.service';
import { PazienteTrovato } from '../../core/models/paziente.models';
import { NotificaService } from '../../core/services/notifica.service';

@Component({
  selector: 'app-carica-referto',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './carica-referto.component.html',
  styleUrl: './carica-referto.component.css',
})
export class CaricaRefertoComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly pazientiService = inject(PazientiService);
  private readonly refertiService = inject(RefertiService);
  private readonly notificaService = inject(NotificaService);

  @ViewChild('inputFile') private inputFile?: ElementRef<HTMLInputElement>;

  public readonly pazienteTrovato = signal<PazienteTrovato | null>(null);
  public readonly ricercaInCorso = signal(false);
  public readonly uploadInCorso = signal(false);

  public fileSelezionato: File | null = null;

  public readonly formRicerca = this.formBuilder.nonNullable.group({
    codiceFiscale: [
      '',
      [Validators.required, Validators.minLength(16), Validators.maxLength(16)],
    ],
  });

  public readonly formUpload = this.formBuilder.nonNullable.group({
    categoria: ['', Validators.required],
    dataEsame: ['', Validators.required],
  });

  constructor() {
    // Ricerca "live": appena il codice fiscale digitato ha 16 caratteri validi,
    // la ricerca parte da sola, senza bisogno di premere un pulsante.
    this.formRicerca.controls.codiceFiscale.valueChanges
      .pipe(
        debounceTime(400), // aspetta una piccola pausa nella digitazione
        distinctUntilChanged(), // non ripetere la stessa ricerca due volte di fila
        filter(() => this.formRicerca.controls.codiceFiscale.valid),
        // Leggiamo il valore direttamente dal controllo (non quello emesso
        // dall'evento) per essere certi di usare la versione già maiuscola,
        // già applicata in sincrono da maiuscoloCF() prima che questo scatti.
        switchMap(() => {
          const codiceFiscale = this.formRicerca.controls.codiceFiscale.value;
          // switchMap annulla automaticamente una ricerca precedente ancora in
          // corso se nel frattempo l'utente digita un codice fiscale diverso:
          // evita che una risposta "vecchia" arrivi dopo una più recente.
          this.ricercaInCorso.set(true);
          this.pazienteTrovato.set(null);
          this.resettaFormUpload();

          return this.pazientiService.cercaPerCodiceFiscale(codiceFiscale).pipe(
            catchError((errore) => {
              this.notificaService.errore(
                errore.error?.errore ?? 'Errore imprevisto, riprova.',
              );
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((paziente) => {
        this.ricercaInCorso.set(false);
        if (paziente) {
          this.pazienteTrovato.set(paziente);
        }
      });
  }

  public maiuscoloCF(): void {
    const valore = this.formRicerca.controls.codiceFiscale.value;
    this.formRicerca.controls.codiceFiscale.setValue(valore.toUpperCase(), {
      emitEvent: false,
    });
  }

  public selezionaFile(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.fileSelezionato = input.files?.[0] ?? null;
  }

  public carica(): void {
    const paziente = this.pazienteTrovato();
    if (!paziente || this.formUpload.invalid || !this.fileSelezionato) {
      return;
    }

    this.uploadInCorso.set(true);

    const { categoria, dataEsame } = this.formUpload.getRawValue();

    this.refertiService
      .upload(paziente.pazienteId, categoria, dataEsame, this.fileSelezionato)
      .subscribe({
        next: () => {
          this.uploadInCorso.set(false);
          this.notificaService.successo('Referto caricato con successo.');
          this.resettaFormUpload();
        },
        error: (errore) => {
          this.uploadInCorso.set(false);
          this.notificaService.errore(
            errore.error?.errore ?? 'Errore imprevisto, riprova.',
          );
        },
      });
  }

  private resettaFormUpload(): void {
    this.formUpload.reset({ categoria: '', dataEsame: '' });
    this.fileSelezionato = null;
    if (this.inputFile) {
      this.inputFile.nativeElement.value = '';
    }
  }
}
