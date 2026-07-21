import * as crypto from "crypto";
import { env } from "../config/env";

// I referti sono documenti clinici: li cifriamo a riposo (AES-256-GCM) così
// che chi ha accesso solo al filesystem (non al server applicativo) non possa
// leggerne il contenuto. Il file cifrato è autosufficiente: contiene IV e tag
// di autenticazione, quindi non serve nessuna tabella/colonna aggiuntiva.
const ALGORITMO = "aes-256-gcm";
const LUNGHEZZA_IV = 12;
const LUNGHEZZA_TAG = 16;

function chiave(): Buffer {
  return Buffer.from(env.fileEncryptionKey, "hex");
}

// Formato su disco: [IV (12 byte)][tag di autenticazione (16 byte)][testo cifrato]
export function cifraBuffer(bufferInChiaro: Buffer): Buffer {
  const iv = crypto.randomBytes(LUNGHEZZA_IV);
  const cifratore = crypto.createCipheriv(ALGORITMO, chiave(), iv);
  const testoCifrato = Buffer.concat([
    cifratore.update(bufferInChiaro),
    cifratore.final(),
  ]);
  const tag = cifratore.getAuthTag();

  return Buffer.concat([iv, tag, testoCifrato]);
}

export function decifraBuffer(bufferCifrato: Buffer): Buffer {
  const iv = bufferCifrato.subarray(0, LUNGHEZZA_IV);
  const tag = bufferCifrato.subarray(LUNGHEZZA_IV, LUNGHEZZA_IV + LUNGHEZZA_TAG);
  const testoCifrato = bufferCifrato.subarray(LUNGHEZZA_IV + LUNGHEZZA_TAG);

  const decifratore = crypto.createDecipheriv(ALGORITMO, chiave(), iv);
  decifratore.setAuthTag(tag);

  return Buffer.concat([decifratore.update(testoCifrato), decifratore.final()]);
}
