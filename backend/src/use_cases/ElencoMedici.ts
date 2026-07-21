import { RuoloUtente } from "../entities/Utente";
import { ErroreAutorizzazione } from "./erroriDominio";
import { injectable, inject } from "tsyringe";
import { IUtenteRepository } from "./ports";

export interface ElencoMediciInput {
  adminId: string; // Chi sta chiedendo l'elenco (dal token JWT)
}

export interface MedicoElenco {
  utenteId: string;
  medicoId: string;
  nome: string;
  cognome: string;
  email: string;
  specializzazione: string;
  numeroMatricola: string;
  attivo: boolean;
}

@injectable()
export class ElencoMediciUseCase {
  constructor(
    @inject("IUtenteRepository") private utenteRepo: IUtenteRepository,
  ) {}

  public async execute(input: ElencoMediciInput): Promise<MedicoElenco[]> {
    const responsabile = await this.utenteRepo.findById(input.adminId);
    if (!responsabile || responsabile.ruolo !== RuoloUtente.ADMIN) {
      throw new ErroreAutorizzazione(
        "Accesso negato: operazione consentita solo agli amministratori.",
      );
    }

    const medici = await this.utenteRepo.findTuttiMediciConProfilo();

    return medici
      .filter((utente) => utente.profiloMedico)
      .map((utente) => ({
        utenteId: utente.id,
        medicoId: utente.profiloMedico!.id,
        nome: utente.nome,
        cognome: utente.cognome,
        email: utente.email,
        specializzazione: utente.profiloMedico!.specializzazione,
        numeroMatricola: utente.profiloMedico!.numeroMatricola,
        attivo: utente.attivo,
      }));
  }
}
