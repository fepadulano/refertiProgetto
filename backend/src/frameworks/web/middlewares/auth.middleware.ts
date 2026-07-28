import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../security/jwtConfig";

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
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res
      .status(401)
      .json({ errore: "Accesso negato: Token mancante o formato non valido" });
    return;
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decodificato = jwt.verify(token, JWT_SECRET) as {
      id: string;
      ruolo: string;
    };

    req.user = decodificato;
    next();
  } catch (error) {
    res
      .status(401)
      .json({ errore: "Token non valido o scaduto. Fai di nuovo il login." });
  }
};
