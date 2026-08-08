// deve essere il primo import assoluto, altrimenti Tsyringe non funziona
import "reflect-metadata";
import { container } from "tsyringe";

import { UtenteRepository } from "./adapters/repositories/UtenteRepository";
import { PazienteRepository } from "./adapters/repositories/PazienteRepository";
import { MedicoRepository } from "./adapters/repositories/MedicoRepository";
import { RefertoRepository } from "./adapters/repositories/RefertoRepository";
import { AuditLogRepository } from "./adapters/repositories/AuditLogRepository";
import { BcryptPasswordHasher } from "./frameworks/security/BcryptPasswordHasher";
import { CryptoGeneratoreUuid } from "./frameworks/utils/CryptoGeneratoreUuid";
import { JwtTokenManager } from "./frameworks/security/JwtTokenManager";
import { SequelizeGestoreTransazioni } from "./frameworks/database/SequelizeGestoreTransazioni";
import { DiskFileStorage } from "./frameworks/storage/DiskFileStorage";

container.registerSingleton("IUtenteRepository", UtenteRepository);
container.registerSingleton("IPazienteRepository", PazienteRepository);
container.registerSingleton("IMedicoRepository", MedicoRepository);
container.registerSingleton("IRefertoRepository", RefertoRepository);
container.registerSingleton("IAuditLogRepository", AuditLogRepository);
container.registerSingleton("IPasswordHasher", BcryptPasswordHasher);
container.registerSingleton("IGeneratoreUuid", CryptoGeneratoreUuid);
container.registerSingleton("ITokenManager", JwtTokenManager);
container.registerSingleton("IGestoreTransazioni", SequelizeGestoreTransazioni);
container.registerSingleton("IFileStorage", DiskFileStorage);

export { container };
