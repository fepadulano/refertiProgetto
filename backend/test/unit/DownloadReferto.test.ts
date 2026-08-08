import { DownloadRefertoUseCase } from "../../src/use_cases/DownloadReferto";
import { Utente, RuoloUtente } from "../../src/entities/Utente";
import { Medico } from "../../src/entities/Medico";
import { Paziente } from "../../src/entities/Paziente";
import { Referto, CategoriaReferto } from "../../src/entities/Referto";
import { TipoAzione } from "../../src/entities/AuditLog";
import { ErroreAutorizzazione } from "../../src/use_cases/erroriDominio";
import { FakeUtenteRepository } from "../fakes/FakeUtenteRepository";
import { FakeRefertoRepository } from "../fakes/FakeRefertoRepository";
import { FakeAuditLogRepository } from "../fakes/FakeAuditLogRepository";
import { FakeGeneratoreUuid } from "../fakes/FakeGeneratoreUuid";

describe("DownloadRefertoUseCase (unit, con repository finti)", () => {
  let utenteRepo: FakeUtenteRepository;
  let refertoRepo: FakeRefertoRepository;
  let auditLogRepo: FakeAuditLogRepository;
  let useCase: DownloadRefertoUseCase;

  const medicoProprietario = new Utente(
    "medico-1",
    "Anna",
    "Neri",
    "anna@test.it",
    "hash",
    RuoloUtente.MEDICO,
  );
  medicoProprietario.profiloMedico = new Medico(
    "profilo-medico-1",
    "medico-1",
    "Radiologia",
    "999",
  );

  const altroMedico = new Utente(
    "medico-2",
    "Marco",
    "Blu",
    "marco@test.it",
    "hash",
    RuoloUtente.MEDICO,
  );
  altroMedico.profiloMedico = new Medico(
    "profilo-medico-2",
    "medico-2",
    "Cardiologia",
    "998",
  );

  const pazienteProprietario = new Utente(
    "paziente-1",
    "Paolo",
    "Bianchi",
    "paolo@test.it",
    "hash",
    RuoloUtente.PAZIENTE,
  );
  pazienteProprietario.profiloPaziente = new Paziente(
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
    auditLogRepo = new FakeAuditLogRepository();
    useCase = new DownloadRefertoUseCase(
      utenteRepo,
      refertoRepo,
      auditLogRepo,
      new FakeGeneratoreUuid(),
    );

    await utenteRepo.salva(medicoProprietario);
    await utenteRepo.salva(altroMedico);
    await utenteRepo.salva(pazienteProprietario);
    await utenteRepo.salva(altroPaziente);

    await refertoRepo.salva(
      new Referto(
        "referto-1",
        "profilo-medico-1",
        "profilo-paziente-1",
        "uploads/referti/finto.pdf",
        CategoriaReferto.RADIOLOGIA,
        new Date("2026-01-10"),
      ),
    );
  });

  it("il medico proprietario del referto può scaricarlo", async () => {
    const percorso = await useCase.execute({
      utenteId: "medico-1",
      refertoId: "referto-1",
      ipAddress: "127.0.0.1",
    });

    expect(percorso).toBe("uploads/referti/finto.pdf");
    expect(auditLogRepo.logs).toHaveLength(1);
    expect(auditLogRepo.logs[0].tipoAzione).toBe(TipoAzione.DOWNLOAD_REFERTO);
  });

  it("il paziente proprietario del referto può scaricarlo", async () => {
    const percorso = await useCase.execute({
      utenteId: "paziente-1",
      refertoId: "referto-1",
      ipAddress: "127.0.0.1",
    });

    expect(percorso).toBe("uploads/referti/finto.pdf");
    expect(auditLogRepo.logs).toHaveLength(1);
    expect(auditLogRepo.logs[0].tipoAzione).toBe(TipoAzione.DOWNLOAD_REFERTO);
  });

  it("un medico diverso da chi ha caricato il referto non può scaricarlo, e viene loggato l'accesso negato", async () => {
    await expect(
      useCase.execute({
        utenteId: "medico-2",
        refertoId: "referto-1",
        ipAddress: "127.0.0.1",
      }),
    ).rejects.toThrow(ErroreAutorizzazione);

    expect(auditLogRepo.logs).toHaveLength(1);
    expect(auditLogRepo.logs[0].tipoAzione).toBe(TipoAzione.ACCESSO_NEGATO);
  });

  it("un paziente diverso dal proprietario del referto non può scaricarlo", async () => {
    await expect(
      useCase.execute({
        utenteId: "paziente-2",
        refertoId: "referto-1",
        ipAddress: "127.0.0.1",
      }),
    ).rejects.toThrow(ErroreAutorizzazione);

    expect(auditLogRepo.logs).toHaveLength(1);
    expect(auditLogRepo.logs[0].tipoAzione).toBe(TipoAzione.ACCESSO_NEGATO);
  });

  it("rifiuta il download di un referto inesistente", async () => {
    await expect(
      useCase.execute({
        utenteId: "medico-1",
        refertoId: "referto-inesistente",
        ipAddress: "127.0.0.1",
      }),
    ).rejects.toThrow("Referto non trovato");
  });
});
