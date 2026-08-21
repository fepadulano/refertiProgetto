import { DisabilitaMedicoUseCase } from "../../src/use_cases/DisabilitaMedico";
import { Utente, RuoloUtente } from "../../src/entities/Utente";
import { TipoAzione } from "../../src/entities/AuditLog";
import { ErroreAutorizzazione } from "../../src/use_cases/erroriDominio";
import { FakeUtenteRepository } from "../fakes/FakeUtenteRepository";
import { FakeAuditLogRepository } from "../fakes/FakeAuditLogRepository";
import { FakeGeneratoreUuid } from "../fakes/FakeGeneratoreUuid";
import { FakeGestoreTransazioni } from "../fakes/FakeGestoreTransazioni";

describe("DisabilitaMedicoUseCase (unit, con repository finti)", () => {
  let utenteRepo: FakeUtenteRepository;
  let auditLogRepo: FakeAuditLogRepository;
  let useCase: DisabilitaMedicoUseCase;

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
    auditLogRepo = new FakeAuditLogRepository();
    useCase = new DisabilitaMedicoUseCase(
      utenteRepo,
      auditLogRepo,
      new FakeGeneratoreUuid(),
      new FakeGestoreTransazioni(),
    );

    await utenteRepo.salva(admin);
    await utenteRepo.salva(medico);
    await utenteRepo.salva(paziente);
  });

  it("disabilita l'account medico e registra DISABILITAZIONE_MEDICO", async () => {
    await useCase.execute({
      adminId: "admin-1",
      medicoUtenteId: "medico-1",
      ipAddress: "127.0.0.1",
    });

    const medicoAggiornato = await utenteRepo.findById("medico-1");
    expect(medicoAggiornato?.attivo).toBe(false);
    expect(auditLogRepo.logs).toHaveLength(1);
    expect(auditLogRepo.logs[0].tipoAzione).toBe(TipoAzione.DISABILITAZIONE_MEDICO);
  });

  it("rifiuta se chi la richiede non è un Admin", async () => {
    await expect(
      useCase.execute({
        adminId: "medico-1",
        medicoUtenteId: "medico-1",
        ipAddress: "127.0.0.1",
      }),
    ).rejects.toThrow(ErroreAutorizzazione);
  });

  it("rifiuta se l'ID indicato non è un account medico", async () => {
    await expect(
      useCase.execute({
        adminId: "admin-1",
        medicoUtenteId: "paziente-1",
        ipAddress: "127.0.0.1",
      }),
    ).rejects.toThrow("Nessun account medico trovato con questo ID.");

    expect(auditLogRepo.logs).toHaveLength(0);
  });
});
