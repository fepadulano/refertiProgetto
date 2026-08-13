import { CambiaPasswordUseCase } from "../../src/use_cases/CambiaPassword";
import { Utente, RuoloUtente } from "../../src/entities/Utente";
import { TipoAzione } from "../../src/entities/AuditLog";
import { FakeUtenteRepository } from "../fakes/FakeUtenteRepository";
import { FakePasswordHasher } from "../fakes/FakePasswordHasher";
import { FakeAuditLogRepository } from "../fakes/FakeAuditLogRepository";
import { FakeGeneratoreUuid } from "../fakes/FakeGeneratoreUuid";
import { FakeGestoreTransazioni } from "../fakes/FakeGestoreTransazioni";

describe("CambiaPasswordUseCase (unit, con repository finti)", () => {
  let utenteRepo: FakeUtenteRepository;
  let passwordHasher: FakePasswordHasher;
  let auditLogRepo: FakeAuditLogRepository;
  let useCase: CambiaPasswordUseCase;

  beforeEach(async () => {
    utenteRepo = new FakeUtenteRepository();
    passwordHasher = new FakePasswordHasher();
    auditLogRepo = new FakeAuditLogRepository();
    useCase = new CambiaPasswordUseCase(
      utenteRepo,
      passwordHasher,
      auditLogRepo,
      new FakeGeneratoreUuid(),
      new FakeGestoreTransazioni(),
    );

    const utente = new Utente(
      "utente-1",
      "Mario",
      "Rossi",
      "mario@test.it",
      await passwordHasher.hash("PasswordProvvisoria1!"),
      RuoloUtente.PAZIENTE,
    );
    utente.deveCambiarePassword = true;
    await utenteRepo.salva(utente);
  });

  it("cambia la password, azzera deveCambiarePassword e registra CAMBIO_PASSWORD", async () => {
    const utenteAggiornato = await useCase.execute({
      utenteId: "utente-1",
      passwordAttuale: "PasswordProvvisoria1!",
      nuovaPassword: "PasswordNuova1!",
      ipAddress: "127.0.0.1",
    });

    expect(utenteAggiornato.deveCambiarePassword).toBe(false);
    expect(
      await passwordHasher.compara(
        "PasswordNuova1!",
        utenteAggiornato.passwordHash,
      ),
    ).toBe(true);
    expect(auditLogRepo.logs).toHaveLength(1);
    expect(auditLogRepo.logs[0].tipoAzione).toBe(TipoAzione.CAMBIO_PASSWORD);
  });

  it("rifiuta il cambio se la password attuale è sbagliata, senza scrivere log", async () => {
    await expect(
      useCase.execute({
        utenteId: "utente-1",
        passwordAttuale: "PasswordSbagliata",
        nuovaPassword: "PasswordNuova1!",
        ipAddress: "127.0.0.1",
      }),
    ).rejects.toThrow("La password attuale non è corretta");

    expect(auditLogRepo.logs).toHaveLength(0);

    const utente = await utenteRepo.findById("utente-1");
    expect(utente?.deveCambiarePassword).toBe(true);
  });

  it("rifiuta il cambio per un utente inesistente", async () => {
    await expect(
      useCase.execute({
        utenteId: "utente-fantasma",
        passwordAttuale: "qualsiasi",
        nuovaPassword: "PasswordNuova1!",
        ipAddress: "127.0.0.1",
      }),
    ).rejects.toThrow("Utente non trovato");
  });
});
