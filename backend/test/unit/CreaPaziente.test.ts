import { CreaPazienteUseCase } from "../../src/use_cases/CreaPaziente";
import { Utente, RuoloUtente } from "../../src/entities/Utente";
import { TipoAzione } from "../../src/entities/AuditLog";
import { ErroreAutorizzazione } from "../../src/use_cases/erroriDominio";
import { FakeUtenteRepository } from "../fakes/FakeUtenteRepository";
import { FakePazienteRepository } from "../fakes/FakePazienteRepository";
import { FakeAuditLogRepository } from "../fakes/FakeAuditLogRepository";
import { FakePasswordHasher } from "../fakes/FakePasswordHasher";
import { FakeGeneratoreUuid } from "../fakes/FakeGeneratoreUuid";
import { FakeGestoreTransazioni } from "../fakes/FakeGestoreTransazioni";

describe("CreaPazienteUseCase (unit, con repository finti)", () => {
  let utenteRepo: FakeUtenteRepository;
  let pazienteRepo: FakePazienteRepository;
  let auditLogRepo: FakeAuditLogRepository;
  let useCase: CreaPazienteUseCase;

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
    pazienteRepo = new FakePazienteRepository();
    auditLogRepo = new FakeAuditLogRepository();
    useCase = new CreaPazienteUseCase(
      utenteRepo,
      pazienteRepo,
      auditLogRepo,
      new FakePasswordHasher(),
      new FakeGeneratoreUuid(),
      new FakeGestoreTransazioni(),
    );

    await utenteRepo.salva(admin);
  });

  it("crea l'account paziente con codice fiscale normalizzato in maiuscolo e registra REGISTRAZIONE_UTENTE", async () => {
    const utente = await useCase.execute({
      adminId: "admin-1",
      nome: "Paolo",
      cognome: "Bianchi",
      email: "paolo@test.it",
      passwordInChiaro: "PasswordProvvisoria1!",
      codiceFiscale: "bncpla80a01h501u",
      dataNascita: new Date("1980-01-01"),
      ipAddress: "127.0.0.1",
    });

    expect(utente.ruolo).toBe(RuoloUtente.PAZIENTE);
    expect(utente.deveCambiarePassword).toBe(true);
    expect(pazienteRepo.pazienti).toHaveLength(1);
    expect(pazienteRepo.pazienti[0].codiceFiscale).toBe("BNCPLA80A01H501U");
    expect(auditLogRepo.logs).toHaveLength(1);
    expect(auditLogRepo.logs[0].tipoAzione).toBe(TipoAzione.REGISTRAZIONE_UTENTE);
  });

  it("rifiuta la creazione se l'email è già usata da un altro account", async () => {
    await useCase.execute({
      adminId: "admin-1",
      nome: "Paolo",
      cognome: "Bianchi",
      email: "paolo@test.it",
      passwordInChiaro: "PasswordProvvisoria1!",
      codiceFiscale: "BNCPLA80A01H501U",
      dataNascita: new Date("1980-01-01"),
      ipAddress: "127.0.0.1",
    });

    await expect(
      useCase.execute({
        adminId: "admin-1",
        nome: "Paolo",
        cognome: "Bianchi",
        email: "paolo@test.it",
        passwordInChiaro: "AltraPassword1!",
        codiceFiscale: "GLLSRA85A01H501U",
        dataNascita: new Date("1985-01-01"),
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
        nome: "Paolo",
        cognome: "Bianchi",
        email: "paolo@test.it",
        passwordInChiaro: "PasswordProvvisoria1!",
        codiceFiscale: "BNCPLA80A01H501U",
        dataNascita: new Date("1980-01-01"),
        ipAddress: "127.0.0.1",
      }),
    ).rejects.toThrow(ErroreAutorizzazione);

    expect(pazienteRepo.pazienti).toHaveLength(0);
  });
});
