import { expect, test, type Page } from '@playwright/test'

// Alta de usuario sin correo: Dirección crea la cuenta, obtiene la temporal en
// pantalla y (opcionalmente) el PDF; la persona entra con la temporal y es
// forzada a definir su propia contraseña antes de poder navegar.

const entrar = async (page: Page, email: string, password: string) => {
  await page.addInitScript(() => localStorage.setItem('wh_tour_v1', 'done'))
  await page.goto('/login')
  await page.getByPlaceholder('Usuario o correo').fill(email)
  await page.getByPlaceholder('Contraseña').fill(password)
  await page.getByRole('button', { name: /arrancar/i }).click()
}

test('alta con temporal en pantalla, PDF y cambio obligatorio al primer login', async ({ page }, testInfo) => {
  // Correo único por ejecución/reintento: el alta no puede chocar con 409
  const correo = `temporal.e2e.${Date.now()}.${testInfo.retry}@warhorse.mx`

  // Dirección da de alta y captura la temporal mostrada una sola vez
  await entrar(page, 'direccion@warhorse.mx', 'warhorse-demo')
  await page.getByRole('navigation').getByRole('button', { name: 'Usuarios' }).click()
  await expect(page.getByRole('heading', { name: /usuarios y permisos/i })).toBeVisible()
  await page.getByPlaceholder(/nombre del nuevo usuario/i).fill('Temporal E2E')
  await page.getByPlaceholder(/correo del nuevo usuario/i).fill(correo)
  await page.getByRole('combobox', { name: /rol del nuevo usuario/i }).selectOption('taller')
  await page.getByRole('button', { name: /\+ agregar/i }).click({ force: true })

  const tarjeta = page.getByRole('dialog', { name: /credenciales de/i })
  await expect(tarjeta).toBeVisible()
  const temporal = (await tarjeta.locator('code').innerText()).trim()
  expect(temporal.length).toBeGreaterThanOrEqual(8)

  // El PDF se descarga al hacer clic (verificamos el evento de descarga)
  const descarga = page.waitForEvent('download')
  await tarjeta.getByRole('button', { name: /descargar pdf/i }).click({ force: true })
  const archivo = await descarga
  expect(archivo.suggestedFilename()).toContain('credenciales')

  await tarjeta.getByRole('button', { name: /entendido/i }).click({ force: true })
  await page.getByRole('button', { name: /salir/i }).click({ force: true })

  // La persona entra con la temporal → forzada a definir su contraseña
  // (el guard no la deja aterrizar en su módulo)
  await entrar(page, correo, temporal)
  await expect(page.getByRole('heading', { name: /define tu contraseña/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /requisición de refacciones/i })).toHaveCount(0)

  // Define su contraseña y entra a su módulo
  await page.getByLabel(/contraseña temporal/i).fill(temporal)
  await page.getByLabel(/nueva contraseña/i).fill('miClaveWarhorse9')
  await page.getByLabel(/confirmar contraseña/i).fill('miClaveWarhorse9')
  await page.getByRole('button', { name: /guardar y entrar/i }).click({ force: true })
  await expect(page.getByRole('heading', { name: /requisición de refacciones/i })).toBeVisible()

  // La nueva contraseña permite un login limpio, sin volver a pedir cambio
  await page.getByRole('button', { name: /salir/i }).click({ force: true })
  await entrar(page, correo, 'miClaveWarhorse9')
  await expect(page.getByRole('heading', { name: /requisición de refacciones/i })).toBeVisible()
})
