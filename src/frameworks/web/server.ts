import "reflect-metadata";
import "../../container";
import express from "express";
import cors from "cors";
import { inizializzaDatabase } from "../database/database";
import { env } from "../config/env";

import { authRouter } from "./routes/auth.routes";
import { refertiRouter } from "./routes/referti.routes";
import { adminRouter } from "./routes/admin.routes";
import { pazientiRouter } from "./routes/pazienti.routes";
import { gestoreErrori } from "./middlewares/errorHandler.middleware";

const app = express();
const PORT = env.port;

// Permette al frontend Angular (su un'altra origine) di chiamare queste API
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

// Monta i router sui rispettivi prefissi
app.use("/api/auth", authRouter);
app.use("/api/referti", refertiRouter);
app.use("/api/admin", adminRouter);
app.use("/api/pazienti", pazientiRouter);

// Deve essere l'ultimo middleware: intercetta ogni errore non gestito
// (compresi quelli lanciati da multer) e risponde sempre in JSON
app.use(gestoreErrori);

async function avviaServer() {
  try {
    console.log("🚀 Avvio del server in corso...");
    await inizializzaDatabase();
    app.listen(PORT, () => {
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
