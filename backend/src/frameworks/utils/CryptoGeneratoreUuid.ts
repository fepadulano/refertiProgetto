import * as crypto from "crypto";
import { IGeneratoreUuid } from "../../use_cases/ports";

export class CryptoGeneratoreUuid implements IGeneratoreUuid {
  public genera(): string {
    return crypto.randomUUID();
  }
}
