import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { ruoloGuard } from "./core/guards/ruolo.guard";
import { passwordGuard } from "./core/guards/password.guard";
import { RuoloUtente } from "./core/models/ruolo-utente";

// lazy loading: loadComponent importa il file solo quando l'utente ci naviga
export const routes: Routes = [
  {
    path: "login",
    loadComponent: () =>
      import("./auth/login/login.component").then((m) => m.LoginComponent),
  },
  {
    // fuori dal layout e senza passwordGuard, altrimenti si creerebbe un
    // redirect infinito verso se stessa
    path: "cambia-password",
    loadComponent: () =>
      import("./auth/cambia-password/cambia-password.component").then(
        (m) => m.CambiaPasswordComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "",
    loadComponent: () =>
      import("./shared/layout/layout.component").then((m) => m.LayoutComponent),
    canActivate: [authGuard, passwordGuard],
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
        path: "registra-paziente",
        loadComponent: () =>
          import(
            "./admin/registra-paziente/registra-paziente.component"
          ).then((m) => m.RegistraPazienteComponent),
        canActivate: [ruoloGuard],
        data: { ruoloRichiesto: RuoloUtente.ADMIN },
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
