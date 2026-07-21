import { LoginUseCase } from "../../src/use_cases/Login";
import { Utente, RuoloUtente } from "../../src/entities/Utente";
import { TipoAzione } from "../../src/entities/AuditLog";
import { FakeUtenteRepository } from "../fakes/FakeUtenteRepository";
import { FakePasswordHasher } from "../fakes/FakePasswordHasher";
import { FakeTokenManager } from "../fakes/FakeTokenManager";
import { FakeAuditLogRepository } from "../fakes/FakeAuditLogRepository";
import { FakeUuidGenerator } from "../fakes/FakeUuidGenerator";

describe("LoginUseCase (unit, con repository finti)", () => {
  let utenteRepo: FakeUtenteRepository;
  let passwordHasher: FakePasswordHasher;
  let auditLogRepo: FakeAuditLogRepository;
  let useCase: LoginUseCase;

  beforeEach(async () => {
    utenteRepo = new FakeUtenteRepository();
    passwordHasher = new FakePasswordHasher();
    auditLogRepo = new FakeAuditLogRepository();
    useCase = new LoginUseCase(
      utenteRepo,
      passwordHasher,
      new FakeTokenManager(),
      auditLogRepo,
      new FakeUuidGenerator(),
    );

    await utenteRepo.salva(
      new Utente(
        "utente-1",
        "Mario",
        "Rossi",
        "mario@test.it",
        await passwordHasher.hash("PasswordCorretta1!"),
        RuoloUtente.PAZIENTE,
      ),
    );
  });

  it("restituisce un token e registra LOGIN_EFFETTUATO con credenziali corrette", async () => {
    const token = await useCase.execute({
      email: "mario@test.it",
      passwordInChiaro: "PasswordCorretta1!",
      ipAddress: "127.0.0.1",
    });

    expect(token).toBe("token-per-utente-1");
    expect(auditLogRepo.logs).toHaveLength(1);
    expect(auditLogRepo.logs[0].tipoAzione).toBe(TipoAzione.LOGIN_EFFETTUATO);
  });

  it("rifiuta una password sbagliata e registra LOGIN_FALLITO", async () => {
    await expect(
      useCase.execute({
        email: "mario@test.it",
        passwordInChiaro: "PasswordSbagliata",
        ipAddress: "127.0.0.1",
      }),
    ).rejects.toThrow("Credenziali non valide");

    expect(auditLogRepo.logs).toHaveLength(1);
    expect(auditLogRepo.logs[0].tipoAzione).toBe(TipoAzione.LOGIN_FALLITO);
  });

  it("rifiuta un'email inesistente senza scrivere nessun log", async () => {
    await expect(
      useCase.execute({
        email: "sconosciuto@test.it",
        passwordInChiaro: "qualsiasi",
        ipAddress: "127.0.0.1",
      }),
    ).rejects.toThrow("Credenziali non valide");

    expect(auditLogRepo.logs).toHaveLength(0);
  });

  it("blocca l'account dopo 5 tentativi falliti, anche con la password corretta", async () => {
    for (let i = 0; i < 5; i++) {
      await expect(
        useCase.execute({
          email: "mario@test.it",
          passwordInChiaro: "PasswordSbagliata",
          ipAddress: "127.0.0.1",
        }),
      ).rejects.toThrow("Credenziali non valide");
    }

    await expect(
      useCase.execute({
        email: "mario@test.it",
        passwordInChiaro: "PasswordCorretta1!",
        ipAddress: "127.0.0.1",
      }),
    ).rejects.toThrow(/Troppi tentativi falliti/);

    const ultimoLog = auditLogRepo.logs[auditLogRepo.logs.length - 1];
    expect(ultimoLog.tipoAzione).toBe(TipoAzione.ACCESSO_NEGATO);
  });
});
