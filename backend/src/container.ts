// deve essere il primo import assoluto, altrimenti Tsyringe non funziona
import "reflect-metadata";
import { container } from "tsyringe";

import { UtenteRepository } from "./adapters/repositories/UtenteRepository";
import { PazienteRepository } from "./adapters/repositories/PazienteRepository";
import { MedicoRepository } from "./adapters/repositories/MedicoRepository";
import { RefertoRepository } from "./adapters/repositories/RefertoRepository";
import { AuditLogRepository } from "./adapters/repositories/AuditLogRepository";
import { BcryptPasswordHasher } from "./frameworks/security/BcryptPasswordHasher";
import { CryptoUuidGenerator } from "./frameworks/utils/CryptoUuidGenerator";
import { JwtTokenManager } from "./frameworks/security/JwtTokenManager";
import { SequelizeGestoreTransazioni } from "./frameworks/database/SequelizeGestoreTransazioni";

container.registerSingleton("IUtenteRepository", UtenteRepository);
container.registerSingleton("IPazienteRepository", PazienteRepository);
container.registerSingleton("IMedicoRepository", MedicoRepository);
container.registerSingleton("IRefertoRepository", RefertoRepository);
container.registerSingleton("IAuditLogRepository", AuditLogRepository);
container.registerSingleton("IPasswordHasher", BcryptPasswordHasher);
container.registerSingleton("IUuidGenerator", CryptoUuidGenerator);
container.registerSingleton("ITokenManager", JwtTokenManager);
container.registerSingleton("IGestoreTransazioni", SequelizeGestoreTransazioni);

export { container };
