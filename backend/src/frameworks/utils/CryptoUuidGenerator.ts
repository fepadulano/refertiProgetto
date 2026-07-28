import * as crypto from "crypto";
import { IUuidGenerator } from "../../use_cases/ports";

export class CryptoUuidGenerator implements IUuidGenerator {
  public genera(): string {
    return crypto.randomUUID();
  }
}
