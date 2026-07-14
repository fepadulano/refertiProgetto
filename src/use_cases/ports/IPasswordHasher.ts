export interface IPasswordHasher {
  hash(passwordInChiaro: string): Promise<string>;
  compara(passwordInChiaro: string, hashSalvato: string): Promise<boolean>;
}
