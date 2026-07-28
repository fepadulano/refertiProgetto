import { TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { of, throwError } from "rxjs";
import { LoginComponent } from "./login.component";
import { AuthService } from "../../core/services/auth.service";
import { NotificaService } from "../../core/services/notifica.service";

describe("LoginComponent", () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let notificaServiceSpy: jasmine.SpyObj<NotificaService>;
  let router: Router;
  let grecaptchaSpy: {
    render: jasmine.Spy;
    getResponse: jasmine.Spy;
    reset: jasmine.Spy;
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj("AuthService", ["login"]);
    notificaServiceSpy = jasmine.createSpyObj("NotificaService", ["errore"]);

    // finto grecaptcha: render() già definita, così ngAfterViewInit la
    // chiama al primo giro del setInterval e lo cancella subito
    grecaptchaSpy = {
      render: jasmine.createSpy("render"),
      getResponse: jasmine.createSpy("getResponse").and.returnValue("token-captcha-finto"),
      reset: jasmine.createSpy("reset"),
    };
    (window as unknown as { grecaptcha: unknown }).grecaptcha = grecaptchaSpy;

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificaService, useValue: notificaServiceSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, "navigateByUrl").and.resolveTo(true);
  });

  function crea() {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    return fixture;
  }

  it("non chiama il login se il form non è valido", () => {
    const fixture = crea();
    fixture.componentInstance.invia();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it("in caso di successo effettua il login e reindirizza alla home", () => {
    authServiceSpy.login.and.returnValue(
      of({ messaggio: "ok", token: "finto" }),
    );
    const fixture = crea();
    fixture.componentInstance.form.setValue({
      email: "utente@esempio.it",
      password: "segreta1",
    });

    fixture.componentInstance.invia();

    expect(authServiceSpy.login).toHaveBeenCalledWith({
      email: "utente@esempio.it",
      password: "segreta1",
      captchaToken: "token-captcha-finto",
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith("/");
  });

  it("non chiama il login se il captcha non è stato completato", () => {
    grecaptchaSpy.getResponse.and.returnValue("");
    const fixture = crea();
    fixture.componentInstance.form.setValue({
      email: "utente@esempio.it",
      password: "segreta1",
    });

    fixture.componentInstance.invia();

    expect(authServiceSpy.login).not.toHaveBeenCalled();
    expect(notificaServiceSpy.errore).toHaveBeenCalledWith(
      "Completa la verifica captcha prima di continuare.",
    );
  });

  it("in caso di errore mostra una notifica e non naviga", () => {
    authServiceSpy.login.and.returnValue(
      throwError(() => ({ error: { errore: "Credenziali non valide" } })),
    );
    const fixture = crea();
    fixture.componentInstance.form.setValue({
      email: "utente@esempio.it",
      password: "sbagliata",
    });

    fixture.componentInstance.invia();

    expect(notificaServiceSpy.errore).toHaveBeenCalledWith(
      "Credenziali non valide",
    );
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
