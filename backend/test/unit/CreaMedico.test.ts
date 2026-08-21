import { CreaMedicoUseCase } from "../../src/use_cases/CreaMedico";
import { Utente, RuoloUtente } from "../../src/entities/Utente";
import { TipoAzione } from "../../src/entities/AuditLog";
import { ErroreAutorizzazione } from "../../src/use_cases/erroriDominio";
import { FakeUtenteRepository } from "../fakes/FakeUtenteRepository";
import { FakeMedicoRepository } from "../fakes/FakeMedicoRepository";
import { FakeAuditLogRepository } from "../fakes/FakeAuditLogRepository";
import { FakePasswordHasher } from "../fakes/FakePasswordHasher";
import { FakeGeneratoreUuid } from "../fakes/FakeGeneratoreUuid";
import { FakeGestoreTransazioni } from "../fakes/FakeGestoreTransazioni";

describe("CreaMedicoUseCase (unit, con repository finti)", () => {
  let utenteRepo: FakeUtenteRepository;
  let medicoRepo: FakeMedicoRepository;
  let auditLogRepo: FakeAuditLogRepository;
  let useCase: CreaMedicoUseCase;

  const admin = new Utente(
    "admin-1",
    "Anna",
    "Neri",
    "admin@test.it",
    "hash",
    RuoloUtente.ADMIN,
  );

  beforeEach(async () => {
    utenteRepo = new FakeUtenteRepository();
    medicoRepo = new FakeMedicoRepository();
    auditLogRepo = new FakeAuditLogRepository();
    useCase = new CreaMedicoUseCase(
      utenteRepo,
      medicoRepo,
      auditLogRepo,
      new FakePasswordHasher(),
      new FakeGeneratoreUuid(),
      new FakeGestoreTransazioni(),
    );

    await utenteRepo.salva(admin);
  });

  it("crea l'account medico con password provvisoria e registra REGISTRAZIONE_UTENTE", async () => {
    const utente = await useCase.execute({
      adminId: "admin-1",
      nome: "Mario",
      cognome: "Rossi",
      email: "Mario.Rossi@Test.it",
      passwordInChiaro: "PasswordProvvisoria1!",
      specializzazione: "Radiologia",
      numeroMatricola: "MED001",
      ipAddress: "127.0.0.1",
    });

    expect(utente.ruolo).toBe(RuoloUtente.MEDICO);
    expect(utente.deveCambiarePassword).toBe(true);
    expect(medicoRepo.medici).toHaveLength(1);
    expect(medicoRepo.medici[0].specializzazione).toBe("Radiologia");
    expect(auditLogRepo.logs).toHaveLength(1);
    expect(auditLogRepo.logs[0].tipoAzione).toBe(TipoAzione.REGISTRAZIONE_UTENTE);
  });

  it("normalizza l'email in minuscolo, così due varianti di maiuscole non aggirano il controllo di unicità", async () => {
    await useCase.execute({
      adminId: "admin-1",
      nome: "Mario",
      cognome: "Rossi",
      email: "Mario.Rossi@Test.it",
      passwordInChiaro: "PasswordProvvisoria1!",
      specializzazione: "Radiologia",
      numeroMatricola: "MED001",
      ipAddress: "127.0.0.1",
    });

    await expect(
      useCase.execute({
        adminId: "admin-1",
        nome: "Mario",
        cognome: "Rossi",
        email: "mario.rossi@test.it",
        passwordInChiaro: "AltraPassword1!",
        specializzazione: "Cardiologia",
        numeroMatricola: "MED002",
        ipAddress: "127.0.0.1",
      }),
    ).rejects.toThrow("Esiste già un account con questa email.");
  });

  it("rifiuta la creazione se chi la richiede non è un Admin", async () => {
    const medico = new Utente(
      "medico-1",
      "Luca",
      "Verdi",
      "luca@test.it",
      "hash",
      RuoloUtente.MEDICO,
    );
    await utenteRepo.salva(medico);

    await expect(
      useCase.execute({
        adminId: "medico-1",
        nome: "Mario",
        cognome: "Rossi",
        email: "mario@test.it",
        passwordInChiaro: "PasswordProvvisoria1!",
        specializzazione: "Radiologia",
        numeroMatricola: "MED001",
        ipAddress: "127.0.0.1",
      }),
    ).rejects.toThrow(ErroreAutorizzazione);

    expect(medicoRepo.medici).toHaveLength(0);
  });
});
