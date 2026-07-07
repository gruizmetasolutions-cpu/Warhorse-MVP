import { expect, test, type Page } from '@playwright/test'

// Smoke E2E del Sprint 1 (doc 06 §4 AUTH): login real contra la API CI4 y
// la BD sembrada; cada rol aterriza en su vista (RF-AUTH-01/02).

const entrar = async (page: Page, email: string, password = 'warhorse-demo') => {
  // Antes del goto: marca el tour como visto para que su overlay no tape la UI
  await page.addInitScript(() => localStorage.setItem('wh_tour_v1', 'done'))
  await page.goto('/login')
  await page.getByPlaceholder('Usuario o correo').fill(email)
  await page.getByPlaceholder('Contraseña').fill(password)
  await page.getByRole('button', { name: /arrancar/i }).click()
}

test('Dirección aterriza en el Tablero Directivo', async ({ page }) => {
  await entrar(page, 'direccion@warhorse.mx')
  await expect(page.getByRole('heading', { name: /tablero directivo/i })).toBeVisible()
  await expect(page.getByText('Dirección WarHorse · Admin')).toBeVisible()
})

test('Taller aterriza en Requisición y su nav está filtrado por rol', async ({ page }) => {
  await entrar(page, 'edgar@warhorse.mx')
  await expect(page.getByRole('heading', { name: /requisición de refacciones/i })).toBeVisible()
  const nav = page.getByRole('navigation')
  await expect(nav.getByRole('button', { name: 'Requisición' })).toBeVisible()
  await expect(nav.getByRole('button', { name: 'Compras' })).toHaveCount(0)
  await expect(nav.getByRole('button', { name: 'Tablero' })).toHaveCount(0)
})

test('Compras aterriza en su Panel', async ({ page }) => {
  await entrar(page, 'montzay@warhorse.mx')
  await expect(page.getByRole('heading', { name: /panel de compras/i })).toBeVisible()
})

test('credenciales inválidas muestran error genérico y no entran', async ({ page }) => {
  await entrar(page, 'direccion@warhorse.mx', 'contraseña-mala')
  await expect(page.getByText('Credenciales inválidas.')).toBeVisible()
  await expect(page).toHaveURL(/\/login/)
})

test('Salir revoca la sesión y regresa al login', async ({ page }) => {
  await entrar(page, 'montzay@warhorse.mx')
  await expect(page.getByRole('heading', { name: /panel de compras/i })).toBeVisible()
  await page.getByRole('button', { name: 'Salir' }).click()
  await expect(page.getByRole('heading', { name: /entrar al hub/i })).toBeVisible()
})
