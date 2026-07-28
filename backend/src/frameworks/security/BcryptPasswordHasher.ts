import * as bcrypt from "bcrypt";
import { IPasswordHasher } from "../../use_cases/ports";

export class BcryptPasswordHasher implements IPasswordHasher {
  // 10 round: buon compromesso tra sicurezza e velocità
  private readonly saltRounds = 10;

  public async hash(passwordInChiaro: string): Promise<string> {
    return await bcrypt.hash(passwordInChiaro, this.saltRounds);
  }

  public async compara(
    passwordInChiaro: string,
    hashSalvato: string,
  ): Promise<boolean> {
    return await bcrypt.compare(passwordInChiaro, hashSalvato);
  }
}
