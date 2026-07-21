import * as bcrypt from "bcrypt";
import { IPasswordHasher } from "../../use_cases/ports";

export class BcryptPasswordHasher implements IPasswordHasher {
  // Il "salt" definisce quanto è complessa e sicura l'operazione matematica.
  // 10 è il valore standard raccomandato (un buon compromesso tra sicurezza e velocità).
  private readonly saltRounds = 10;

  // Metodo usato in RegistrazionePaziente e CreaMedico
  public async hash(passwordInChiaro: string): Promise<string> {
    return await bcrypt.hash(passwordInChiaro, this.saltRounds);
  }

  // Metodo usato in Login
  public async compara(
    passwordInChiaro: string,
    hashSalvato: string,
  ): Promise<boolean> {
    return await bcrypt.compare(passwordInChiaro, hashSalvato);
  }
}
