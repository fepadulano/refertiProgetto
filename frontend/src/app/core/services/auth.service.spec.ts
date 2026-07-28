import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { AuthService } from "./auth.service";
import { RuoloUtente } from "../models/ruolo-utente";
import { environment } from "../../../environments/environment";

const CHIAVE_TOKEN = "referti_token";

// jwt-decode legge solo il payload, basta un token finto in formato header.payload.firma
function creaTokenFinto(payload: object): string {
  const parteFinta = btoa("finta");
  const parteFinta64Url = (testo: string) =>
    testo.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const payloadCodificato = parteFinta64Url(btoa(JSON.stringify(payload)));
  return `${parteFinta}.${payloadCodificato}.${parteFinta}`;
}

describe("AuthService", () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem(CHIAVE_TOKEN);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem(CHIAVE_TOKEN);
  });

  it("non ha un utente loggato se non c'è un token salvato", () => {
    expect(service.utenteCorrente()).toBeNull();
  });

  it("dopo il login salva il token e decodifica l'utente", () => {
    const token = creaTokenFinto({ id: "123", ruolo: RuoloUtente.PAZIENTE });

    service.login({ email: "a@b.it", password: "segreta1", captchaToken: "token-finto" }).subscribe();

    const richiesta = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(richiesta.request.method).toBe("POST");
    richiesta.flush({ messaggio: "ok", token });

    expect(localStorage.getItem(CHIAVE_TOKEN)).toBe(token);
    expect(service.utenteCorrente()).toEqual({
      id: "123",
      ruolo: RuoloUtente.PAZIENTE,
    });
  });

  it("il logout rimuove il token e azzera l'utente corrente", () => {
    const token = creaTokenFinto({ id: "123", ruolo: RuoloUtente.MEDICO });
    service.login({ email: "a@b.it", password: "segreta1", captchaToken: "token-finto" }).subscribe();
    httpMock
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ messaggio: "ok", token });

    service.logout();

    expect(localStorage.getItem(CHIAVE_TOKEN)).toBeNull();
    expect(service.utenteCorrente()).toBeNull();
  });
});
