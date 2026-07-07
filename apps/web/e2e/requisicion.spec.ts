import { expect, test, type Page } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = path.dirname(fileURLToPath(import.meta.url))

// Sprint 3 — requisición Yonke completa E2E (doc 06 §4 REQ): foto real,
// cascada de valorización server-side y verificación vía API.

const entrar = async (page: Page, email: string) => {
  await page.addInitScript(() => localStorage.setItem('wh_tour_v1', 'done'))
  await page.goto('/login')
  await page.getByPlaceholder('Usuario o correo').fill(email)
  await page.getByPlaceholder('Contraseña').fill('warhorse-demo')
  await page.getByRole('button', { name: /arrancar/i }).click()
}

test('requisición Yonke con foto real: la cascada calcula el costo por catálogo', async ({ page, request }) => {
  await entrar(page, 'edgar@warhorse.mx')
  await expect(page.getByRole('heading', { name: /requisición de refacciones/i })).toBeVisible()

  await page.getByLabel(/tracto destino/i).selectOption({ label: 'WH104 · Tractor' })
  await page.getByRole('button', { name: /canibalizado de yonke/i }).click({ force: true })
  await page.getByLabel(/tracto donante/i).selectOption({ label: 'WH03 · Yonke donante' })
  await page.getByLabel(/descripción de la pieza/i).fill('Turbo')
  await page.setInputFiles('#foto-pieza', path.join(aqui, 'fixtures', 'pieza.png'))
  await expect(page.getByText(/pieza\.png adjunta/)).toBeVisible()

  // SIN costo manual: el backend resuelve por catálogo (Turbo = $4,500)
  await page.getByRole('button', { name: /enviar requisición/i }).click({ force: true })
  await expect(page.getByText(/Requisición enviada — Compras la verá en su panel/)).toBeVisible()
  await expect(page.getByText(/Costo estimado: \$4,500 \(catalogo\)/)).toBeVisible()

  // Verificación server-side vía API (como la verá Compras)
  const login = await request.post('http://localhost:8080/api/v1/auth/login', {
    data: { email: 'montzay@warhorse.mx', password: 'warhorse-demo' },
  })
  expect(login.ok()).toBeTruthy()
  const { token } = await login.json()

  const listado = await request.get('http://localhost:8080/api/v1/requisiciones', {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(listado.ok()).toBeTruthy()
  const { data } = await listado.json()
  const creada = data.find(
    (r: { descripcion_pieza: string; estado: string }) => r.descripcion_pieza === 'Turbo' && r.estado === 'Solicitado',
  )
  expect(creada).toBeTruthy()
  expect(Number(creada.costo_estimado)).toBe(4500)
  expect(creada.origen_costo_estimado).toBe('catalogo')
  expect(creada.foto_pieza_url).toMatch(/^[a-f0-9]{32}\.png$/)
})

test('la validación del donante Yonke llega verbatim desde el cliente', async ({ page }) => {
  await entrar(page, 'edgar@warhorse.mx')
  await page.getByLabel(/tracto destino/i).selectOption({ label: 'WH101 · Tractor' })
  await page.getByLabel(/descripción de la pieza/i).fill('Turbo')
  await page.getByRole('button', { name: /canibalizado de yonke/i }).click({ force: true })
  await page.getByRole('button', { name: /enviar requisición/i }).click({ force: true })
  await expect(page.getByText('El origen Yonke obliga a registrar la unidad donante.')).toBeVisible()
})
