import * as http from "http";
import { app } from "./app";
import { inizializzaDatabase } from "../database/database";
import { inizializzaSocket } from "./socket";
import { env } from "../config/env";

const PORT = env.port;

async function avviaServer() {
  try {
    console.log("🚀 Avvio del server in corso...");
    await inizializzaDatabase();

    // Socket.io ha bisogno dell'http.Server grezzo, non solo dell'app Express
    const httpServer = http.createServer(app);
    inizializzaSocket(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`✅ Server Express in ascolto sulla porta ${PORT}`);
      console.log(`🔗 Rotte disponibili:`);
      console.log(`   - http://localhost:${PORT}/api/auth`);
      console.log(`   - http://localhost:${PORT}/api/referti`);
      console.log(`   - http://localhost:${PORT}/api/admin`);
    });
  } catch (error) {
    console.error("❌ Errore critico durante l'avvio del server:", error);
    process.exit(1);
  }
}

avviaServer();
