export interface IFileStorage {
  // salva il contenuto (già cifrato) e ritorna un riferimento univoco con
  // cui recuperarlo in seguito — l'implementazione decide cosa significhi
  // davvero quel riferimento (un percorso su disco, una chiave S3, ecc.)
  salva(contenuto: Buffer, estensione: string): Promise<string>;
  leggi(riferimento: string): Promise<Buffer>;
}
