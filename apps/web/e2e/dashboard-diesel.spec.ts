import { expect, test, type Page } from '@playwright/test'

// Sprint 5 — E2E doc 06 §2.3/§2.6: veredicto server-side con ajuste de
// umbral en runtime, ficha completa real y captura de diésel con reflejo
// en el consolidado. Las aserciones se limitan a WH125/CJ12 para no chocar
// con los specs que mutan WH104/WH210 en paralelo.

const entrar = async (page: Page, email: string) => {
  await page.addInitScript(() => localStorage.setItem('wh_tour_v1', 'done'))
  await page.goto('/login')
  await page.getByPlaceholder('Usuario o correo').fill(email)
  await page.getByPlaceholder('Contraseña').fill('warhorse-demo')
  await page.getByRole('button', { name: /arrancar/i }).click()
}

test('dashboard: veredicto server-side, ajuste de umbral y ficha completa', async ({ page, request }) => {
  // La latencia de la BD remota acumula varios fetch en este flujo
  test.setTimeout(180_000)

  // Normalizar parámetros por si un intento anterior quedó a medias
  const login = await request.post('http://localhost:8080/api/v1/auth/login', {
    data: { email: 'direccion@warhorse.mx', password: 'warhorse-demo' },
  })
  const { token } = await login.json()
  await request.patch('http://localhost:8080/api/v1/parametros/veredicto', {
    headers: { Authorization: `Bearer ${token}` },
    data: { umbral_pct: 40, ventana_meses: 12 },
  })

  await entrar(page, 'direccion@warhorse.mx')
  await expect(page.getByRole('heading', { name: /tablero directivo/i })).toBeVisible()

  // La unidad crítica (WH125) llega seleccionada con veredicto Vender y la
  // razón textual calculada por el backend (RF-DASH-04)
  await expect(page.getByText('Vender / dar de baja')).toBeVisible()
  await expect(page.getByText(/ya representa el 45% del valor estimado del tracto \(\$210,000\)/)).toBeVisible()
  await expect(page.getByText(/67% de sus liberaciones fueron "mejoralito"/)).toBeVisible()
  await expect(page.getByText(/Umbral 40% · Ventana 12 meses/)).toBeVisible()

  // Clic en otra barra re-consulta el análisis de esa unidad
  await page.getByRole('button', { name: /wh101/i }).click({ force: true })
  await expect(page.getByText('Mantener')).toBeVisible()
  await expect(page.getByText(/debajo del umbral del 40%/)).toBeVisible()

  // RF-DASH-05: subir el umbral a 50% recalcula el veredicto de WH125
  await page.getByRole('button', { name: /wh125/i }).click({ force: true })
  await expect(page.getByText('Vender / dar de baja')).toBeVisible()
  await page.getByRole('button', { name: /ajustar parámetros/i }).click({ force: true })
  const modal = page.getByRole('dialog', { name: /ajustar parámetros/i })
  await modal.getByLabel(/umbral/i).fill('50')
  await modal.getByRole('button', { name: /guardar/i }).click({ force: true })
  await expect(page.getByText(/Parámetros actualizados — veredictos recalculados/)).toBeVisible()
  await expect(page.getByText('Mantener')).toBeVisible()
  await expect(page.getByText(/Umbral 50% · Ventana 12 meses/)).toBeVisible()

  // De regreso a 40 para dejar la BD como la sembró el globalSetup
  // (esperando a que el toast deje de tapar el botón)
  await expect(page.getByText(/Parámetros actualizados — veredictos recalculados/)).toBeHidden()
  await page.getByRole('button', { name: /ajustar parámetros/i }).click({ force: true })
  await expect(modal).toBeVisible()
  await modal.getByLabel(/umbral/i).fill('40')
  await modal.getByRole('button', { name: /guardar/i }).click({ force: true })
  await expect(page.getByText('Vender / dar de baja')).toBeVisible()

  // Ficha completa real (RF-FIC-01..03): historial y pieza Yonke estimada
  await page.getByRole('button', { name: /ver ficha completa/i }).click({ force: true })
  await expect(page.getByRole('heading', { name: /ficha · wh125/i })).toBeVisible()
  await expect(page.getByText('Transmisión tronada')).toBeVisible()
  await expect(page.getByText('86 días')).toBeVisible()
  await expect(page.getByText('Caja de transmisión')).toBeVisible()
  await expect(page.getByText(/donada por WH60/i)).toBeVisible()
})

test('diésel: Greisy aterriza en su pantalla y registra una carga real', async ({ page, request }) => {
  await entrar(page, 'greisy@warhorse.mx')

  // Landing por rol (RF-USR-03) + nav filtrado
  await expect(page.getByRole('heading', { name: /control de diésel/i })).toBeVisible()
  const nav = page.getByRole('navigation')
  await expect(nav.getByRole('button', { name: 'Diésel' })).toBeVisible()
  await expect(nav.getByRole('button', { name: 'Tablero' })).toHaveCount(0)

  // Captura (RF-DIE-01): CJ12 no participa en el ranking del dashboard
  await page.getByRole('combobox', { name: 'Unidad' }).selectOption({ label: 'CJ12 · Caja' })
  await page.getByLabel(/fecha de la carga/i).fill('2026-07-08')
  await page.getByLabel(/litros/i).fill('120.5')
  await page.getByLabel(/costo total/i).fill('3072.75')
  await page.getByLabel(/kilómetros recorridos/i).fill('265')
  await page.getByRole('button', { name: /registrar carga/i }).click({ force: true })
  await expect(page.getByText(/Carga registrada — el consolidado de CJ12 ya la refleja/)).toBeVisible()
  await expect(page.getByRole('row', { name: /CJ12/ }).first()).toBeVisible()

  // RF-DIE-02 server-side: el consolidado de CJ12 subió exactamente el costo
  const login = await request.post('http://localhost:8080/api/v1/auth/login', {
    data: { email: 'direccion@warhorse.mx', password: 'warhorse-demo' },
  })
  const { token } = await login.json()
  const unidades = await request.get('http://localhost:8080/api/v1/unidades?per_page=100', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const { data } = await unidades.json()
  const cj12 = data.find((u: { id_unidad: string }) => u.id_unidad === 'CJ12')
  // Sembrado: 0 + 2100 + 1400 = 3500; con la carga: 3500 + 3072.75
  expect(cj12.costo_real_acumulado).toBeCloseTo(6572.75, 2)
})
