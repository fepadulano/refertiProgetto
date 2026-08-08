import { UploadRefertoUseCase } from "../../src/use_cases/UploadReferto";
import { CategoriaReferto } from "../../src/entities/Referto";
import { Utente, RuoloUtente } from "../../src/entities/Utente";
import { Medico } from "../../src/entities/Medico";
import { ErroreAutorizzazione } from "../../src/use_cases/erroriDominio";
import { FakeUtenteRepository } from "../fakes/FakeUtenteRepository";
import { FakeRefertoRepository } from "../fakes/FakeRefertoRepository";
import { FakeAuditLogRepository } from "../fakes/FakeAuditLogRepository";
import { FakeGeneratoreUuid } from "../fakes/FakeGeneratoreUuid";
import { FakeGestoreTransazioni } from "../fakes/FakeGestoreTransazioni";

describe("UploadRefertoUseCase (unit, con repository finti)", () => {
  let utenteRepo: FakeUtenteRepository;
  let refertoRepo: FakeRefertoRepository;
  let useCase: UploadRefertoUseCase;

  beforeEach(async () => {
    utenteRepo = new FakeUtenteRepository();
    refertoRepo = new FakeRefertoRepository();
    useCase = new UploadRefertoUseCase(
      utenteRepo,
      refertoRepo,
      new FakeAuditLogRepository(),
      new FakeGeneratoreUuid(),
      new FakeGestoreTransazioni(),
    );

    const medico = new Utente(
      "medico-1",
      "Anna",
      "Neri",
      "anna@test.it",
      "hash",
      RuoloUtente.MEDICO,
    );
    medico.profiloMedico = new Medico(
      "profilo-medico-1",
      "medico-1",
      "Radiologia",
      "999",
    );
    await utenteRepo.salva(medico);

    await utenteRepo.salva(
      new Utente(
        "paziente-1",
        "Paolo",
        "Bianchi",
        "paolo@test.it",
        "hash",
        RuoloUtente.PAZIENTE,
      ),
    );
  });

  it("un medico può caricare un referto", async () => {
    const referto = await useCase.execute({
      utenteId: "medico-1",
      pazienteId: "paziente-1",
      percorsoFile: "uploads/referti/finto.pdf",
      categoria: CategoriaReferto.RADIOLOGIA,
      dataEsame: new Date("2026-01-10"),
      ipAddress: "127.0.0.1",
    });

    expect(refertoRepo.referti).toHaveLength(1);
    expect(referto.medicoId).toBe("profilo-medico-1");
  });

  it("un paziente non può caricare referti", async () => {
    await expect(
      useCase.execute({
        utenteId: "paziente-1",
        pazienteId: "paziente-1",
        percorsoFile: "x.pdf",
        categoria: CategoriaReferto.RADIOLOGIA,
        dataEsame: new Date("2026-01-10"),
        ipAddress: "127.0.0.1",
      }),
    ).rejects.toThrow(ErroreAutorizzazione);
  });
});
