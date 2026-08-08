import { IGeneratoreUuid } from "../../src/use_cases/ports";

// Genera ID prevedibili ("id-finto-1", "id-finto-2", ...) invece di UUID
// casuali, così i test restano leggibili e ripetibili.
export class FakeGeneratoreUuid implements IGeneratoreUuid {
  private contatore = 0;

  public genera(): string {
    this.contatore += 1;
    return `id-finto-${this.contatore}`;
  }
}
