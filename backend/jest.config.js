/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["<rootDir>/test/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  // I test e2e parlano davvero col database: evitiamo che girino
  // in parallelo tra loro e si pestino i piedi a vicenda sui dati.
  maxWorkers: 1,
  testTimeout: 15000,
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "test/tsconfig.json" }],
  },
};
