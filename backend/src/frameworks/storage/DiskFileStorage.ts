import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { IFileStorage } from "../../use_cases/ports";
import { env } from "../config/env";

export class DiskFileStorage implements IFileStorage {
  constructor() {
    fs.mkdirSync(env.uploadDir, { recursive: true });
  }

  public async salva(contenuto: Buffer, estensione: string): Promise<string> {
    const nomeFile = `${crypto.randomUUID()}${estensione}`;
    const percorsoFile = path.join(env.uploadDir, nomeFile);
    fs.writeFileSync(percorsoFile, contenuto);
    return percorsoFile;
  }

  public async leggi(riferimento: string): Promise<Buffer> {
    return fs.readFileSync(riferimento);
  }
}
