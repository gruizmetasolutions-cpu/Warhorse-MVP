import { expect, test, type Page } from '@playwright/test'

// Sprint 4 — ciclos completos E2E (doc 06 §4 COM/TAL): ciclo de compra con
// costo real + factura, instalación con confirmación, y liberación parcial
// con alerta de deuda técnica.

const entrar = async (page: Page, email: string) => {
  await page.addInitScript(() => localStorage.setItem('wh_tour_v1', 'done'))
  await page.goto('/login')
  await page.getByPlaceholder('Usuario o correo').fill(email)
  await page.getByPlaceholder('Contraseña').fill('warhorse-demo')
  await page.getByRole('button', { name: /arrancar/i }).click()
}

test('ciclo de compra completo: Cotizado → Comprado (costo+factura) → Instalado', async ({ page }) => {
  await entrar(page, 'montzay@warhorse.mx')
  await expect(page.getByRole('heading', { name: /panel de compras/i })).toBeVisible()

  const filaBalatas = page.getByRole('row', { name: /balatas de freno/i })
  await filaBalatas.getByRole('button', { name: '→ Comprado' }).click({ force: true })

  const modal = page.getByRole('dialog', { name: /registrar compra/i })
  // El 422 del backend sin costo/factura
  await modal.getByRole('button', { name: /^registrar$/i }).click({ force: true })
  await expect(modal.getByText('Falta el costo real y el número de factura.')).toBeVisible()

  await modal.getByLabel(/costo real/i).fill('1850')
  await modal.getByLabel(/número de factura/i).fill('F-E2E-1')
  await modal.getByRole('button', { name: /^registrar$/i }).click({ force: true })
  await expect(filaBalatas.getByText('Comprado')).toBeVisible()

  // Comprado → Instalado con confirmación
  await filaBalatas.getByRole('button', { name: '→ Instalado' }).click({ force: true })
  const confirmar = page.getByRole('dialog', { name: /confirmar instalación/i })
  await expect(confirmar.getByText('Balatas de freno')).toBeVisible()
  await confirmar.getByRole('button', { name: /sí, marcar instalada/i }).click({ force: true })
  await expect(filaBalatas.getByText('Instalado')).toBeVisible()
  await expect(filaBalatas.getByText('✓ Cerrado')).toBeVisible()
})

test('taller: ingreso y liberación parcial generan alerta y candidata a reincidencia', async ({ page, request }) => {
  await entrar(page, 'edgar@warhorse.mx')
  await page.getByRole('navigation').getByRole('button', { name: 'Taller' }).click()
  await expect(page.getByRole('heading', { name: /control de taller/i })).toBeVisible()

  await page.getByRole('combobox', { name: 'Unidad' }).selectOption({ label: 'WH210 · Tractor' })
  await page.getByLabel(/fecha de ingreso/i).fill('2026-07-07')
  await page.getByLabel(/diagnóstico principal/i).fill('Fuga de aire E2E')
  await page.getByRole('button', { name: /^crítico$/i }).click({ force: true })
  await page.getByRole('button', { name: /registrar ingreso/i }).click({ force: true })
  await expect(page.getByText('Ingreso registrado — la unidad queda En Taller.')).toBeVisible()

  const fila = page.getByRole('row', { name: /fuga de aire e2e/i })
  await fila.getByRole('button', { name: /liberar/i }).click({ force: true })
  const modal = page.getByRole('dialog', { name: /liberar wh210/i })
  await modal.getByRole('button', { name: /parcial \(mejoralito\)/i }).click({ force: true })
  await modal.getByLabel(/fecha de salida/i).fill('2026-07-08')
  await modal.getByLabel(/costo de taller/i).fill('950')
  await modal.getByRole('button', { name: /^liberar$/i }).click({ force: true })
  await expect(modal.getByText('Una liberación parcial exige al menos un pendiente.')).toBeVisible()

  await modal.getByLabel(/pendientes/i).fill('Manguera principal definitiva')
  await modal.getByRole('button', { name: /^liberar$/i }).click({ force: true })
  await expect(page.getByText(/liberada como mejoralito — se generó alerta de deuda técnica/)).toBeVisible()

  // Verificación server-side: WH210 quedó candidata a reincidencia
  const login = await request.post('http://localhost:8080/api/v1/auth/login', {
    data: { email: 'direccion@warhorse.mx', password: 'warhorse-demo' },
  })
  const { token } = await login.json()
  const unidades = await request.get('http://localhost:8080/api/v1/unidades?per_page=100', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const { data } = await unidades.json()
  const wh210 = data.find((u: { id_unidad: string }) => u.id_unidad === 'WH210')
  expect(wh210.candidata_reincidencia).toBeTruthy()
})
