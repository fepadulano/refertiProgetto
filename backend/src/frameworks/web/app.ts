import "reflect-metadata";
import "../../container";
import express from "express";
import cors from "cors";
import { env } from "../config/env";

import { authRouter } from "./routes/auth.routes";
import { refertiRouter } from "./routes/referti.routes";
import { adminRouter } from "./routes/admin.routes";
import { pazientiRouter } from "./routes/pazienti.routes";
import { gestoreErrori } from "./middlewares/errorHandler.middleware";

// Costruisce l'app Express (middleware + rotte) senza avviare l'ascolto
// sulla porta: così i test (Supertest) possono usarla direttamente,
// senza dover aprire un vero socket di rete.
export const app = express();

// Permette al frontend Angular (su un'altra origine) di chiamare queste API.
// exposedHeaders serve perché il browser, di default, nasconde alle chiamate
// cross-origin gli header di risposta non "semplici": senza questo, il
// frontend non potrebbe leggere il nome del file da Content-Disposition
// quando scarica un referto.
app.use(
  cors({ origin: env.corsOrigin, exposedHeaders: ["Content-Disposition"] }),
);
app.use(express.json());

// Monta i router sui rispettivi prefissi
app.use("/api/auth", authRouter);
app.use("/api/referti", refertiRouter);
app.use("/api/admin", adminRouter);
app.use("/api/pazienti", pazientiRouter);

// Deve essere l'ultimo middleware: intercetta ogni errore non gestito
// (compresi quelli lanciati da multer) e risponde sempre in JSON
app.use(gestoreErrori);
