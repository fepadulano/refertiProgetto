import { Component, input, output } from "@angular/core";

// Componente generico: non sa nulla di medici o referti, riceve solo numeri
// e segnala il cambio pagina al genitore tramite un evento.
@Component({
  selector: "app-paginator",
  imports: [],
  templateUrl: "./paginator.component.html",
  styleUrl: "./paginator.component.css",
})
export class PaginatorComponent {
  public readonly paginaCorrente = input.required<number>();
  public readonly numeroPagine = input.required<number>();
  public readonly cambiaPagina = output<number>();

  public precedente(): void {
    this.cambiaPagina.emit(Math.max(1, this.paginaCorrente() - 1));
  }

  public successiva(): void {
    this.cambiaPagina.emit(Math.min(this.numeroPagine(), this.paginaCorrente() + 1));
  }
}
