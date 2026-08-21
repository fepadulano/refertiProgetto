import { StoricoRefertiPropriUseCase } from "../../src/use_cases/StoricoRefertiPropri";
import { Utente, RuoloUtente } from "../../src/entities/Utente";
import { Paziente } from "../../src/entities/Paziente";
import { Referto, CategoriaReferto } from "../../src/entities/Referto";
import { ErroreAutorizzazione } from "../../src/use_cases/erroriDominio";
import { FakeUtenteRepository } from "../fakes/FakeUtenteRepository";
import { FakeRefertoRepository } from "../fakes/FakeRefertoRepository";

describe("StoricoRefertiPropriUseCase (unit, con repository finti)", () => {
  let utenteRepo: FakeUtenteRepository;
  let refertoRepo: FakeRefertoRepository;
  let useCase: StoricoRefertiPropriUseCase;

  const paziente = new Utente(
    "paziente-1",
    "Paolo",
    "Bianchi",
    "paolo@test.it",
    "hash",
    RuoloUtente.PAZIENTE,
  );
  paziente.profiloPaziente = new Paziente(
    "profilo-1",
    "paziente-1",
    "BNCPLA80A01H501U",
    new Date("1980-01-01"),
  );

  const medico = new Utente(
    "medico-1",
    "Mario",
    "Rossi",
    "mario@test.it",
    "hash",
    RuoloUtente.MEDICO,
  );

  beforeEach(async () => {
    utenteRepo = new FakeUtenteRepository();
    refertoRepo = new FakeRefertoRepository();
    useCase = new StoricoRefertiPropriUseCase(utenteRepo, refertoRepo);

    await utenteRepo.salva(paziente);
    await utenteRepo.salva(medico);

    await refertoRepo.salva(
      new Referto(
        "referto-1",
        "medico-1",
        "profilo-1",
        "uploads/referti/radiografia.pdf",
        CategoriaReferto.RADIOLOGIA,
        new Date("2026-01-10"),
      ),
    );
    await refertoRepo.salva(
      new Referto(
        "referto-2",
        "medico-1",
        "profilo-1",
        "uploads/referti/analisi.pdf",
        CategoriaReferto.ESAMI_DEL_SANGUE,
        new Date("2026-02-01"),
      ),
    );
  });

  it("restituisce lo storico del paziente che lo richiede", async () => {
    const referti = await useCase.execute({ utenteId: "paziente-1" });

    expect(referti).toHaveLength(2);
  });

  it("filtra lo storico per categoria", async () => {
    const referti = await useCase.execute({
      utenteId: "paziente-1",
      categoria: CategoriaReferto.RADIOLOGIA,
    });

    expect(referti).toHaveLength(1);
    expect(referti[0].id).toBe("referto-1");
  });

  it("rifiuta la richiesta se chi la fa non è un account paziente", async () => {
    await expect(useCase.execute({ utenteId: "medico-1" })).rejects.toThrow(
      ErroreAutorizzazione,
    );
  });
});
