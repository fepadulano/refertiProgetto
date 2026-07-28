import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  FiltriStorico,
  StoricoRefertiResponse,
  UploadRefertoResponse,
} from "../models/referto.models";

@Injectable({ providedIn: "root" })
export class RefertiService {
  private readonly http = inject(HttpClient);

  public storicoProprio(
    filtri: FiltriStorico,
  ): Observable<StoricoRefertiResponse> {
    let parametri = new HttpParams();
    if (filtri.categoria) {
      parametri = parametri.set("categoria", filtri.categoria);
    }
    if (filtri.dataInizio) {
      parametri = parametri.set("dataInizio", filtri.dataInizio);
    }
    if (filtri.dataFine) {
      parametri = parametri.set("dataFine", filtri.dataFine);
    }

    return this.http.get<StoricoRefertiResponse>(
      `${environment.apiUrl}/pazienti/me/referti`,
      { params: parametri },
    );
  }

  // niente <a href>: serve il token Bearer, quindi scarichiamo come blob
  public download(refertoId: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/referti/${refertoId}/download`, {
      responseType: "blob",
    });
  }

  // RF4: multipart/form-data, non JSON
  public upload(
    pazienteId: string,
    categoria: string,
    dataEsame: string,
    file: File,
  ): Observable<UploadRefertoResponse> {
    const datiForm = new FormData();
    datiForm.append("pazienteId", pazienteId);
    datiForm.append("categoria", categoria);
    datiForm.append("dataEsame", dataEsame);
    datiForm.append("file", file);

    return this.http.post<UploadRefertoResponse>(
      `${environment.apiUrl}/referti`,
      datiForm,
    );
  }
}
