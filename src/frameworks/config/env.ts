import * as dotenv from "dotenv";

dotenv.config({ quiet: true });

function richiesta(nomeVariabile: string): string {
  const valore = process.env[nomeVariabile];
  if (!valore) {
    throw new Error(
      `Variabile d'ambiente mancante: ${nomeVariabile}. Controlla il file .env (vedi .env.example).`,
    );
  }
  return valore;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  db: {
    nome: richiesta("DB_NAME"),
    utente: richiesta("DB_USER"),
    password: richiesta("DB_PASSWORD"),
    host: richiesta("DB_HOST"),
  },
  jwt: {
    secret: richiesta("JWT_SECRET"),
    scadenza: process.env.JWT_EXPIRES_IN ?? "2h",
  },
  uploadDir: process.env.UPLOAD_DIR ?? "uploads/referti",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:4200",
  fileEncryptionKey: richiesta("FILE_ENCRYPTION_KEY"),
};
