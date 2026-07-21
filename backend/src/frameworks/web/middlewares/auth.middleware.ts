import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../security/jwtConfig";

// Creiamo un'interfaccia personalizzata per dire a TypeScript che la nostra
// Request avrà un oggetto "user" al suo interno
export interface AuthRequest extends Request {
  user?: {
    id: string;
    ruolo: string;
  };
}

export const abilitaProtezioneJwt = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  // 1. Estraiamo l'header di sicurezza "Authorization" che invierà Postman
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res
      .status(401)
      .json({ errore: "Accesso negato: Token mancante o formato non valido" });
    return;
  }

  // 2. Puliamo la stringa (togliamo la parola "Bearer " per avere solo il token puro)
  const token = authHeader.replace("Bearer ", "");

  try {
    // 3. Verifichiamo il token usando la STESSA chiave segreta del JwtTokenManager
    const decodificato = jwt.verify(token, JWT_SECRET) as {
      id: string;
      ruolo: string;
    };

    // 4. Salviamo i dati dell'utente direttamente nella richiesta
    req.user = decodificato;

    // 5. Tutto ok! Passiamo la palla al Controller
    next();
  } catch (error) {
    res
      .status(401)
      .json({ errore: "Token non valido o scaduto. Fai di nuovo il login." });
  }
};
