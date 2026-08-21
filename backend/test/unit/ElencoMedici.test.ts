import { ElencoMediciUseCase } from "../../src/use_cases/ElencoMedici";
import { Utente, RuoloUtente } from "../../src/entities/Utente";
import { Medico } from "../../src/entities/Medico";
import { ErroreAutorizzazione } from "../../src/use_cases/erroriDominio";
import { FakeUtenteRepository } from "../fakes/FakeUtenteRepository";

describe("ElencoMediciUseCase (unit, con repository finti)", () => {
  let utenteRepo: FakeUtenteRepository;
  let useCase: ElencoMediciUseCase;

  const admin = new Utente(
    "admin-1",
    "Anna",
    "Neri",
    "admin@test.it",
    "hash",
    RuoloUtente.ADMIN,
  );

  const medico = new Utente(
    "medico-1",
    "Mario",
    "Rossi",
    "mario@test.it",
    "hash",
    RuoloUtente.MEDICO,
  );
  medico.profiloMedico = new Medico("profilo-1", "medico-1", "Radiologia", "MED001");

  const paziente = new Utente(
    "paziente-1",
    "Paolo",
    "Bianchi",
    "paolo@test.it",
    "hash",
    RuoloUtente.PAZIENTE,
  );

  beforeEach(async () => {
    utenteRepo = new FakeUtenteRepository();
    useCase = new ElencoMediciUseCase(utenteRepo);

    await utenteRepo.salva(admin);
    await utenteRepo.salva(medico);
    await utenteRepo.salva(paziente);
  });

  it("restituisce solo gli account medico, con i dati del profilo", async () => {
    const elenco = await useCase.execute({ adminId: "admin-1" });

    expect(elenco).toHaveLength(1);
    expect(elenco[0].utenteId).toBe("medico-1");
    expect(elenco[0].specializzazione).toBe("Radiologia");
    expect(elenco[0].numeroMatricola).toBe("MED001");
  });

  it("rifiuta se chi la richiede non è un Admin", async () => {
    await expect(useCase.execute({ adminId: "medico-1" })).rejects.toThrow(
      ErroreAutorizzazione,
    );
  });
});
