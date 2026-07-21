import { TestBed } from "@angular/core/testing";
import { PaginatorComponent } from "./paginator.component";

describe("PaginatorComponent", () => {
  function crea(paginaCorrente: number, numeroPagine: number) {
    const fixture = TestBed.createComponent(PaginatorComponent);
    fixture.componentRef.setInput("paginaCorrente", paginaCorrente);
    fixture.componentRef.setInput("numeroPagine", numeroPagine);
    fixture.detectChanges();
    return fixture;
  }

  function bottoni(fixture: ReturnType<typeof crea>) {
    const elementi = fixture.nativeElement.querySelectorAll("button");
    return { precedente: elementi[0] as HTMLButtonElement, successiva: elementi[1] as HTMLButtonElement };
  }

  it("mostra la pagina corrente e il totale", () => {
    const fixture = crea(2, 5);
    const testo = (fixture.nativeElement as HTMLElement).textContent;
    expect(testo).toContain("Pagina 2 di 5");
  });

  it("disabilita 'Precedente' sulla prima pagina", () => {
    const fixture = crea(1, 5);
    const { precedente, successiva } = bottoni(fixture);
    expect(precedente.disabled).toBeTrue();
    expect(successiva.disabled).toBeFalse();
  });

  it("disabilita 'Successiva' sull'ultima pagina", () => {
    const fixture = crea(5, 5);
    const { precedente, successiva } = bottoni(fixture);
    expect(precedente.disabled).toBeFalse();
    expect(successiva.disabled).toBeTrue();
  });

  it("emette cambiaPagina con il numero corretto quando si clicca 'Successiva'", () => {
    const fixture = crea(2, 5);
    const paginaEmessa = jasmine.createSpy("paginaEmessa");
    fixture.componentInstance.cambiaPagina.subscribe(paginaEmessa);

    bottoni(fixture).successiva.click();

    expect(paginaEmessa).toHaveBeenCalledWith(3);
  });

  it("emette cambiaPagina con il numero corretto quando si clicca 'Precedente'", () => {
    const fixture = crea(2, 5);
    const paginaEmessa = jasmine.createSpy("paginaEmessa");
    fixture.componentInstance.cambiaPagina.subscribe(paginaEmessa);

    bottoni(fixture).precedente.click();

    expect(paginaEmessa).toHaveBeenCalledWith(1);
  });
});
