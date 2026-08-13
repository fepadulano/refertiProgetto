import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, tap } from "rxjs";
import { jwtDecode } from "jwt-decode";
import { environment } from "../../../environments/environment";
import {
  CambiaPasswordRequest,
  CambiaPasswordResponse,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  UtenteAutenticato,
} from "../models/auth.models";

const CHIAVE_TOKEN = "referti_token";
const CHIAVE_REFRESH_TOKEN = "referti_refresh_token";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(HttpClient);

  // Utente attualmente loggato, ricavato dal token salvato (null se nessuno)
  public readonly utenteCorrente = signal<UtenteAutenticato | null>(
    this.leggiUtenteDalToken(),
  );

  public login(dati: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, dati)
      .pipe(tap((risposta) => this.salvaSessione(risposta.token, risposta.refreshToken)));
  }

  // Scambia il refresh token per un nuovo access token, senza richiedere
  // di nuovo email/password/captcha: usato dall'interceptor quando il
  // token in uso scade (vedi errore.interceptor.ts).
  public refreshToken(): Observable<RefreshResponse> {
    return this.http
      .post<RefreshResponse>(`${environment.apiUrl}/auth/refresh`, {
        refreshToken: this.getRefreshToken(),
      })
      .pipe(tap((risposta) => this.salvaToken(risposta.token)));
  }

  // RF2/RF9: sostituisce la password provvisoria data dall'Admin con una
  // scelta dal titolare dell'account (Sezione 4.1.10). Il backend restituisce
  // un token nuovo, già senza il flag deveCambiarePassword.
  public cambiaPassword(
    dati: CambiaPasswordRequest,
  ): Observable<CambiaPasswordResponse> {
    return this.http
      .post<CambiaPasswordResponse>(
        `${environment.apiUrl}/auth/cambia-password`,
        dati,
      )
      .pipe(tap((risposta) => this.salvaToken(risposta.token)));
  }

  public logout(): void {
    localStorage.removeItem(CHIAVE_TOKEN);
    localStorage.removeItem(CHIAVE_REFRESH_TOKEN);
    this.utenteCorrente.set(null);
  }

  public getToken(): string | null {
    return localStorage.getItem(CHIAVE_TOKEN);
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem(CHIAVE_REFRESH_TOKEN);
  }

  private salvaSessione(token: string, refreshToken: string): void {
    localStorage.setItem(CHIAVE_REFRESH_TOKEN, refreshToken);
    this.salvaToken(token);
  }

  private salvaToken(token: string): void {
    localStorage.setItem(CHIAVE_TOKEN, token);
    this.utenteCorrente.set(this.decodificaToken(token));
  }

  private leggiUtenteDalToken(): UtenteAutenticato | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    return this.decodificaToken(token);
  }

  // il payload del token contiene id e ruolo, messi dal backend in fase di login
  private decodificaToken(token: string): UtenteAutenticato | null {
    try {
      return jwtDecode<UtenteAutenticato>(token);
    } catch {
      return null;
    }
  }
}
