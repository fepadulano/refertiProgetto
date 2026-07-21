import { IPasswordHasher } from "../../src/use_cases/ports";

// Non usa bcrypt davvero: nei test non ci interessa la sicurezza crittografica,
// solo che "hash" e "compara" si comportino in modo coerente tra loro.
export class FakePasswordHasher implements IPasswordHasher {
  public async hash(passwordInChiaro: string): Promise<string> {
    return `hash(${passwordInChiaro})`;
  }

  public async compara(
    passwordInChiaro: string,
    hashSalvato: string,
  ): Promise<boolean> {
    return hashSalvato === `hash(${passwordInChiaro})`;
  }
}
