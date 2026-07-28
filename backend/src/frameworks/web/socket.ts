import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import * as jwt from "jsonwebtoken";
import { JWT_SECRET } from "../security/jwtConfig";
import { env } from "../config/env";
import { container } from "../../container";
import { IPazienteRepository } from "../../use_cases/ports";
import { RuoloUtente } from "../../entities/Utente";

interface TokenDecodificato {
  id: string;
  ruolo: RuoloUtente;
}

// Un paziente può avere più schede/dispositivi aperti: per ognuno teniamo
// traccia dell'id della connessione, associati allo stesso pazienteId.
const socketPerPaziente = new Map<string, Set<string>>();

let io: SocketServer | undefined;

export function inizializzaSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: { origin: env.corsOrigin },
  });

  // stesso principio di abilitaProtezioneJwt per le richieste HTTP
  io.use((socket, next) => {
    const token = socket.handshake.auth?.["token"] as string | undefined;
    if (!token) {
      next(new Error("Token mancante"));
      return;
    }
    try {
      const decodificato = jwt.verify(token, JWT_SECRET) as TokenDecodificato;
      socket.data.utenteId = decodificato.id;
      socket.data.ruolo = decodificato.ruolo;
      next();
    } catch {
      next(new Error("Token non valido o scaduto"));
    }
  });

  io.on("connection", async (socket: Socket) => {
    // per ora solo i pazienti ricevono notifiche in tempo reale
    if (socket.data.ruolo !== RuoloUtente.PAZIENTE) {
      return;
    }

    const pazienteRepo = container.resolve<IPazienteRepository>(
      "IPazienteRepository",
    );
    const paziente = await pazienteRepo.findByUtenteId(socket.data.utenteId);
    if (!paziente) {
      return;
    }

    aggiungiSocket(paziente.id, socket.id);

    socket.on("disconnect", () => {
      rimuoviSocket(paziente.id, socket.id);
    });
  });

  return io;
}

function aggiungiSocket(pazienteId: string, socketId: string): void {
  const esistenti = socketPerPaziente.get(pazienteId) ?? new Set<string>();
  esistenti.add(socketId);
  socketPerPaziente.set(pazienteId, esistenti);
}

function rimuoviSocket(pazienteId: string, socketId: string): void {
  socketPerPaziente.get(pazienteId)?.delete(socketId);
}

// se il paziente non è connesso, la notifica va semplicemente persa
export function notificaPaziente(
  pazienteId: string,
  evento: string,
  dati: unknown,
): void {
  const socketIds = socketPerPaziente.get(pazienteId);
  if (!io || !socketIds) {
    return;
  }
  for (const socketId of socketIds) {
    io.to(socketId).emit(evento, dati);
  }
}
