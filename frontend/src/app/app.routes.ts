import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { ruoloGuard } from "./core/guards/ruolo.guard";
import { RuoloUtente } from "./core/models/ruolo-utente";

// Ogni pagina viene scaricata dal browser solo quando l'utente ci naviga
// davvero (lazy loading), invece di scaricare tutto il codice dell'app fin
// dal primo caricamento. loadComponent sostituisce "component" con una
// funzione che importa il file solo al momento del bisogno.
export const routes: Routes = [
  {
    path: "login",
    loadComponent: () =>
      import("./auth/login/login.component").then((m) => m.LoginComponent),
  },
  {
    path: "registrazione",
    loadComponent: () =>
      import("./auth/registrazione/registrazione.component").then(
        (m) => m.RegistrazioneComponent,
      ),
  },
  {
    path: "",
    loadComponent: () =>
      import("./shared/layout/layout.component").then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: "",
        loadComponent: () =>
          import("./home/home.component").then((m) => m.HomeComponent),
      },
      {
        path: "storico",
        loadComponent: () =>
          import("./referti/storico/storico-referti.component").then(
            (m) => m.StoricoRefertiComponent,
          ),
        canActivate: [ruoloGuard],
        data: { ruoloRichiesto: RuoloUtente.PAZIENTE },
      },
      {
        path: "carica-referto",
        loadComponent: () =>
          import("./medico/carica-referto/carica-referto.component").then(
            (m) => m.CaricaRefertoComponent,
          ),
        canActivate: [ruoloGuard],
        data: { ruoloRichiesto: RuoloUtente.MEDICO },
      },
      {
        path: "gestione-medici",
        loadComponent: () =>
          import("./admin/gestione-medici/gestione-medici.component").then(
            (m) => m.GestioneMediciComponent,
          ),
        canActivate: [ruoloGuard],
        data: { ruoloRichiesto: RuoloUtente.ADMIN },
      },
    ],
  },
  { path: "**", redirectTo: "" },
];
