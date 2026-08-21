import { RicercaPazienteUseCase } from "../../src/use_cases/RicercaPaziente";
import { Utente, RuoloUtente } from "../../src/entities/Utente";
import { Paziente } from "../../src/entities/Paziente";
import { ErroreAutorizzazione } from "../../src/use_cases/erroriDominio";
import { FakeUtenteRepository } from "../fakes/FakeUtenteRepository";
import { FakePazienteRepository } from "../fakes/FakePazienteRepository";

describe("RicercaPazienteUseCase (unit, con repository finti)", () => {
  let utenteRepo: FakeUtenteRepository;
  let pazienteRepo: FakePazienteRepository;
  let useCase: RicercaPazienteUseCase;

  const medico = new Utente(
    "medico-1",
    "Mario",
    "Rossi",
    "mario@test.it",
    "hash",
    RuoloUtente.MEDICO,
  );

  const admin = new Utente(
    "admin-1",
    "Anna",
    "Neri",
    "admin@test.it",
    "hash",
    RuoloUtente.ADMIN,
  );

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
    pazienteRepo = new FakePazienteRepository();
    useCase = new RicercaPazienteUseCase(utenteRepo, pazienteRepo);

    await utenteRepo.salva(medico);
    await utenteRepo.salva(admin);
    await utenteRepo.salva(paziente);
    await pazienteRepo.salva(
      new Paziente("profilo-1", "paziente-1", "BNCPLA80A01H501U", new Date("1980-01-01")),
    );
  });

  it("trova il paziente cercando il codice fiscale in minuscolo", async () => {
    const risultato = await useCase.execute({
      medicoUtenteId: "medico-1",
      codiceFiscale: "bncpla80a01h501u",
    });

    expect(risultato.utenteId).toBe("paziente-1");
    expect(risultato.nome).toBe("Paolo");
  });

  it("rifiuta la ricerca se chi la richiede non è un Medico", async () => {
    await expect(
      useCase.execute({
        medicoUtenteId: "admin-1",
        codiceFiscale: "BNCPLA80A01H501U",
      }),
    ).rejects.toThrow(ErroreAutorizzazione);
  });

  it("segnala se nessun paziente ha quel codice fiscale", async () => {
    await expect(
      useCase.execute({
        medicoUtenteId: "medico-1",
        codiceFiscale: "INESISTENTE00A00A000A",
      }),
    ).rejects.toThrow("Nessun paziente trovato con questo codice fiscale.");
  });
});
