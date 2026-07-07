import { expect, test, type Page } from '@playwright/test'

// Sprint 2 — propagación del catálogo vivo (RF-UNI-01/02): una unidad dada
// de alta por Dirección aparece de inmediato en los selectores del taller.

const entrar = async (page: Page, email: string) => {
  // Antes del goto: marca el tour como visto para que su overlay no tape la UI
  await page.addInitScript(() => localStorage.setItem('wh_tour_v1', 'done'))
  await page.goto('/login')
  await page.getByPlaceholder('Usuario o correo').fill(email)
  await page.getByPlaceholder('Contraseña').fill('warhorse-demo')
  await page.getByRole('button', { name: /arrancar/i }).click()
}

test('alta de unidad por admin se propaga al selector de Requisición', async ({ page }) => {
  const idUnidad = 'E2E' + String(Date.now()).slice(-6)

  await entrar(page, 'direccion@warhorse.mx')
  await page.getByRole('navigation').getByRole('button', { name: 'Catálogo' }).click()
  await expect(page.getByRole('heading', { name: /catálogo de unidades/i })).toBeVisible()

  await page.getByRole('button', { name: /\+ agregar unidad/i }).click({ force: true })
  const dialogo = page.getByRole('dialog', { name: /agregar unidad/i })
  await dialogo.getByLabel(/id de la unidad/i).fill(idUnidad)
  await dialogo.getByLabel(/fecha de alta/i).fill('2026-07-07')
  await dialogo.getByLabel(/valor de referencia/i).fill('500000')
  await dialogo.getByRole('button', { name: /guardar/i }).click({ force: true })

  await expect(page.getByText(`${idUnidad} dada de alta en la flota`)).toBeVisible()
  await expect(page.getByRole('cell', { name: idUnidad })).toBeVisible()

  // Cambio de rol: el taller ve la unidad nueva en su selector (catálogo vivo)
  await page.getByRole('button', { name: 'Salir' }).click()
  await entrar(page, 'edgar@warhorse.mx')
  await expect(page.getByRole('heading', { name: /requisición de refacciones/i })).toBeVisible()
  await expect(page.getByRole('option', { name: `${idUnidad} · Tractor` })).toBeAttached()
})

test('el 409 del backend llega al modal en alta duplicada', async ({ page }) => {
  await entrar(page, 'direccion@warhorse.mx')
  await page.getByRole('navigation').getByRole('button', { name: 'Catálogo' }).click()
  await page.getByRole('button', { name: /\+ agregar unidad/i }).click({ force: true })
  const dialogo = page.getByRole('dialog', { name: /agregar unidad/i })
  await dialogo.getByLabel(/id de la unidad/i).fill('WH125')
  await dialogo.getByLabel(/fecha de alta/i).fill('2026-07-07')
  await dialogo.getByRole('button', { name: /guardar/i }).click({ force: true })
  await expect(dialogo.getByText(/ya existe una unidad/i)).toBeVisible()
})
