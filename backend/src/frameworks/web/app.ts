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

// non avvia l'ascolto sulla porta: così i test (Supertest) possono usarla direttamente
export const app = express();

// exposedHeaders serve perché il browser nasconde di default gli header
// cross-origin: senza, il frontend non leggerebbe Content-Disposition al download
app.use(
  cors({ origin: env.corsOrigin, exposedHeaders: ["Content-Disposition"] }),
);
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/referti", refertiRouter);
app.use("/api/admin", adminRouter);
app.use("/api/pazienti", pazientiRouter);

// deve stare per ultimo: intercetta ogni errore non gestito (anche quelli di multer)
app.use(gestoreErrori);
