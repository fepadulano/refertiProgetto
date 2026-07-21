import { TestBed } from "@angular/core/testing";
import { ActivatedRouteSnapshot, UrlTree, provideRouter } from "@angular/router";
import { ruoloGuard } from "./ruolo.guard";
import { AuthService } from "../services/auth.service";
import { RuoloUtente } from "../models/ruolo-utente";
import { UtenteAutenticato } from "../models/auth.models";

describe("ruoloGuard", () => {
  let utenteCorrente: UtenteAutenticato | null;

  beforeEach(() => {
    utenteCorrente = null;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { utenteCorrente: () => utenteCorrente },
        },
      ],
    });
  });

  function eseguiGuardia(ruoloRichiesto: RuoloUtente) {
    const route = {
      data: { ruoloRichiesto },
    } as unknown as ActivatedRouteSnapshot;

    return TestBed.runInInjectionContext(() => ruoloGuard(route, {} as never));
  }

  it("lascia passare se il ruolo dell'utente corrisponde a quello richiesto", () => {
    utenteCorrente = { id: "1", ruolo: RuoloUtente.MEDICO };
    expect(eseguiGuardia(RuoloUtente.MEDICO)).toBe(true);
  });

  it("reindirizza alla home se il ruolo non corrisponde", () => {
    utenteCorrente = { id: "1", ruolo: RuoloUtente.PAZIENTE };
    const risultato = eseguiGuardia(RuoloUtente.MEDICO);
    expect(risultato).not.toBe(true);
    expect((risultato as UrlTree).toString()).toBe("/");
  });
});
