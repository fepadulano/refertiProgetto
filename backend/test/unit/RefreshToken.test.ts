import { RefreshTokenUseCase } from "../../src/use_cases/RefreshToken";
import { Utente, RuoloUtente } from "../../src/entities/Utente";
import { FakeUtenteRepository } from "../fakes/FakeUtenteRepository";
import { FakeTokenManager } from "../fakes/FakeTokenManager";

describe("RefreshTokenUseCase (unit, con repository finti)", () => {
  let utenteRepo: FakeUtenteRepository;
  let useCase: RefreshTokenUseCase;

  beforeEach(async () => {
    utenteRepo = new FakeUtenteRepository();
    useCase = new RefreshTokenUseCase(utenteRepo, new FakeTokenManager());

    await utenteRepo.salva(
      new Utente(
        "utente-1",
        "Mario",
        "Rossi",
        "mario@test.it",
        "hash",
        RuoloUtente.PAZIENTE,
      ),
    );

    await utenteRepo.salva(
      new Utente(
        "utente-2",
        "Luca",
        "Verdi",
        "luca@test.it",
        "hash",
        RuoloUtente.MEDICO,
        false, // deveCambiarePassword
        false, // attivo: l'account è disabilitato
      ),
    );
  });

  it("con un refresh token valido restituisce un nuovo access token", async () => {
    const token = await useCase.execute({
      refreshToken: "refresh-per-utente-1",
    });

    expect(token).toBe("token-per-utente-1");
  });

  it("rifiuta un refresh token malformato", async () => {
    await expect(
      useCase.execute({ refreshToken: "qualcosa-di-strano" }),
    ).rejects.toThrow("Refresh token non valido o scaduto");
  });

  it("rifiuta il refresh se l'utente non esiste più", async () => {
    await expect(
      useCase.execute({ refreshToken: "refresh-per-utente-inesistente" }),
    ).rejects.toThrow("Refresh token non valido o scaduto");
  });

  it("rifiuta il refresh se l'account è stato disabilitato nel frattempo", async () => {
    await expect(
      useCase.execute({ refreshToken: "refresh-per-utente-2" }),
    ).rejects.toThrow("Refresh token non valido o scaduto");
  });
});
