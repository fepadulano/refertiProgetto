import { TestBed } from "@angular/core/testing";
import { UrlTree, provideRouter } from "@angular/router";
import { authGuard } from "./auth.guard";
import { AuthService } from "../services/auth.service";
import { RuoloUtente } from "../models/ruolo-utente";
import { UtenteAutenticato } from "../models/auth.models";

describe("authGuard", () => {
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

  function eseguiGuardia() {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );
  }

  it("lascia passare se un utente è loggato", () => {
    utenteCorrente = { id: "1", ruolo: RuoloUtente.PAZIENTE };
    expect(eseguiGuardia()).toBe(true);
  });

  it("reindirizza al login se nessun utente è loggato", () => {
    const risultato = eseguiGuardia();
    expect(risultato).not.toBe(true);
    expect((risultato as UrlTree).toString()).toBe("/login");
  });
});
