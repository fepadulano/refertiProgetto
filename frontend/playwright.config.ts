import { defineConfig, devices } from "@playwright/test";

// I test girano contro l'app vera: frontend, backend ed Express partono da
// soli (webServer sotto), ma Postgres deve essere già acceso a parte.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:4200",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm run start",
      url: "http://localhost:4200",
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: "npm run dev",
      cwd: "../backend",
      port: 3000,
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
