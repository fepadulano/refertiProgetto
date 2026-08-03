import { ConsultazioneStoricoUseCase } from "../../src/use_cases/ConsultazioneStorico";
import { Utente, RuoloUtente } from "../../src/entities/Utente";
import { Medico } from "../../src/entities/Medico";
import { Paziente } from "../../src/entities/Paziente";
import { Referto } from "../../src/entities/Referto";
import { ErroreAutorizzazione } from "../../src/use_cases/erroriDominio";
import { FakeUtenteRepository } from "../fakes/FakeUtenteRepository";
import { FakeRefertoRepository } from "../fakes/FakeRefertoRepository";

describe("ConsultazioneStoricoUseCase (unit, con repository finti)", () => {
  let utenteRepo: FakeUtenteRepository;
  let refertoRepo: FakeRefertoRepository;
  let useCase: ConsultazioneStoricoUseCase;

  const medico = new Utente(
    "medico-1",
    "Anna",
    "Neri",
    "anna@test.it",
    "hash",
    RuoloUtente.MEDICO,
  );
  medico.profiloMedico = new Medico("profilo-medico-1", "medico-1", "Radiologia", "999");

  const paziente = new Utente(
    "paziente-1",
    "Paolo",
    "Bianchi",
    "paolo@test.it",
    "hash",
    RuoloUtente.PAZIENTE,
  );
  paziente.profiloPaziente = new Paziente(
    "profilo-paziente-1",
    "paziente-1",
    "BNCPLA80A01H501U",
    new Date("1980-01-01"),
  );

  const altroPaziente = new Utente(
    "paziente-2",
    "Sara",
    "Gialli",
    "sara@test.it",
    "hash",
    RuoloUtente.PAZIENTE,
  );
  altroPaziente.profiloPaziente = new Paziente(
    "profilo-paziente-2",
    "paziente-2",
    "GLLSRA85A01H501U",
    new Date("1985-01-01"),
  );

  beforeEach(async () => {
    utenteRepo = new FakeUtenteRepository();
    refertoRepo = new FakeRefertoRepository();
    useCase = new ConsultazioneStoricoUseCase(utenteRepo, refertoRepo);

    await utenteRepo.salva(medico);
    await utenteRepo.salva(paziente);
    await utenteRepo.salva(altroPaziente);

    await refertoRepo.salva(
      new Referto(
        "referto-1",
        "profilo-medico-1",
        "profilo-paziente-1",
        "uploads/referti/finto.pdf",
        "Radiografia",
        new Date("2026-01-10"),
      ),
    );
  });

  it("un medico può consultare lo storico di qualsiasi paziente", async () => {
    const referti = await useCase.execute({
      utenteId: "medico-1",
      pazienteId: "profilo-paziente-1",
    });

    expect(referti).toHaveLength(1);
  });

  it("un paziente può consultare il proprio storico", async () => {
    const referti = await useCase.execute({
      utenteId: "paziente-1",
      pazienteId: "profilo-paziente-1",
    });

    expect(referti).toHaveLength(1);
  });

  it("un paziente non può consultare lo storico di un altro paziente", async () => {
    await expect(
      useCase.execute({
        utenteId: "paziente-2",
        pazienteId: "profilo-paziente-1",
      }),
    ).rejects.toThrow(ErroreAutorizzazione);
  });
});
