import * as crypto from "crypto";
import { IUuidGenerator } from "../../use_cases/ports";

export class CryptoUuidGenerator implements IUuidGenerator {
  // Implementa il metodo richiesto dai vari Casi d'Uso (Registrazione, CreaMedico, Upload, ecc.)
  public genera(): string {
    return crypto.randomUUID();
  }
}
