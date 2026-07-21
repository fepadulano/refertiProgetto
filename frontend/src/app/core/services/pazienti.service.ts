import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { PazienteTrovato } from "../models/paziente.models";

@Injectable({ providedIn: "root" })
export class PazientiService {
  private readonly http = inject(HttpClient);

  // RF3: ricerca di un paziente per codice fiscale (solo Medico)
  public cercaPerCodiceFiscale(
    codiceFiscale: string,
  ): Observable<PazienteTrovato> {
    const parametri = new HttpParams().set("codiceFiscale", codiceFiscale);
    return this.http.get<PazienteTrovato>(`${environment.apiUrl}/pazienti`, {
      params: parametri,
    });
  }
}
