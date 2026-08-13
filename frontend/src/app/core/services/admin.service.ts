import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  CreaMedicoRequest,
  CreaMedicoResponse,
  ElencoMediciResponse,
} from "../models/medico.models";
import {
  CreaPazienteRequest,
  CreaPazienteResponse,
} from "../models/paziente.models";

@Injectable({ providedIn: "root" })
export class AdminService {
  private readonly http = inject(HttpClient);

  public elencoMedici(): Observable<ElencoMediciResponse> {
    return this.http.get<ElencoMediciResponse>(
      `${environment.apiUrl}/admin/medici`,
    );
  }

  public creaMedico(dati: CreaMedicoRequest): Observable<CreaMedicoResponse> {
    return this.http.post<CreaMedicoResponse>(
      `${environment.apiUrl}/admin/crea-medico`,
      dati,
    );
  }

  // RF9: l'Admin (segreteria/accettazione) crea l'account del Paziente dopo
  // averne verificato di persona l'identità
  public creaPaziente(
    dati: CreaPazienteRequest,
  ): Observable<CreaPazienteResponse> {
    return this.http.post<CreaPazienteResponse>(
      `${environment.apiUrl}/admin/crea-paziente`,
      dati,
    );
  }

  public disabilitaMedico(medicoUtenteId: string): Observable<{ messaggio: string }> {
    return this.http.post<{ messaggio: string }>(
      `${environment.apiUrl}/admin/medici/${medicoUtenteId}/disabilita`,
      {},
    );
  }
}
