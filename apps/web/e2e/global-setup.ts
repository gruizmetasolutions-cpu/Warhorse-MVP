import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Los E2E consumen estados sembrados (avanzan requisiciones, liberan
 * unidades). Para que la suite sea idempotente, se re-siembra la BD de
 * desarrollo antes de cada corrida.
 */
export default function globalSetup(): void {
  const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../api')
  execSync('php spark db:seed InitialSeeder', { cwd: apiDir, stdio: 'inherit', timeout: 300_000 })
  // Limpia el caché del throttler (login/mutaciones) para que los contadores
  // no arrastren estado de corridas previas y disparen 429 falsos.
  execSync('php spark cache:clear', { cwd: apiDir, stdio: 'inherit', timeout: 60_000 })
}
