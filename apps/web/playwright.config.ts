import { defineConfig } from '@playwright/test'
import os from 'node:os'
import path from 'node:path'

// Chromium de Playwright necesita libnspr4/libnss3/libasound2; en esta WSL
// viven extraídas (sin sudo) en ~/.local/share/warhorse/libs.
const libsLocales = path.join(os.homedir(), '.local/share/warhorse/libs')
process.env.LD_LIBRARY_PATH = [libsLocales, process.env.LD_LIBRARY_PATH ?? ''].filter(Boolean).join(':')

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout: 60_000,
  retries: 1,
  // `php spark serve` es monohilo: los specs se ejecutan en serie para no
  // saturar el servidor de desarrollo con peticiones concurrentes.
  workers: 1,
  // La BD de desarrollo es remota (Hostinger): el login puede tardar >5s
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: [
    {
      // API real contra la BD de desarrollo sembrada
      command: 'php spark serve --port 8080',
      cwd: '../api',
      url: 'http://localhost:8080/api/v1/auth/me',
      reuseExistingServer: true,
      timeout: 30_000,
      // /auth/me sin token responde 401: el servidor está arriba
      ignoreHTTPSErrors: true,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173/login',
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
})
