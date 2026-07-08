# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard-diesel.spec.ts >> dashboard: veredicto server-side, ajuste de umbral y ficha completa
- Location: e2e/dashboard-diesel.spec.ts:16:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /tablero directivo/i })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByRole('heading', { name: /tablero directivo/i })

```

```yaml
- complementary:
  - text: Hub de Gastos WarHorse México
  - navigation:
    - button "Tablero"
    - button "Requisición"
    - button "Taller"
    - button "Compras"
    - button "Diésel"
    - button "Catálogo"
    - button "Usuarios"
  - text: Sesión activa · Hub v1 Dirección WarHorse · Admin
  - button "▶ Tutorial"
  - button "Salir"
- main
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test'
  2   | 
  3   | // Sprint 5 — E2E doc 06 §2.3/§2.6: veredicto server-side con ajuste de
  4   | // umbral en runtime, ficha completa real y captura de diésel con reflejo
  5   | // en el consolidado. Las aserciones se limitan a WH125/CJ12 para no chocar
  6   | // con los specs que mutan WH104/WH210 en paralelo.
  7   | 
  8   | const entrar = async (page: Page, email: string) => {
  9   |   await page.addInitScript(() => localStorage.setItem('wh_tour_v1', 'done'))
  10  |   await page.goto('/login')
  11  |   await page.getByPlaceholder('Usuario o correo').fill(email)
  12  |   await page.getByPlaceholder('Contraseña').fill('warhorse-demo')
  13  |   await page.getByRole('button', { name: /arrancar/i }).click()
  14  | }
  15  | 
  16  | test('dashboard: veredicto server-side, ajuste de umbral y ficha completa', async ({ page, request }) => {
  17  |   // La latencia de la BD remota acumula varios fetch en este flujo
  18  |   test.setTimeout(180_000)
  19  | 
  20  |   // Normalizar parámetros por si un intento anterior quedó a medias
  21  |   const login = await request.post('http://localhost:8080/api/v1/auth/login', {
  22  |     data: { email: 'direccion@warhorse.mx', password: 'warhorse-demo' },
  23  |   })
  24  |   const { token } = await login.json()
  25  |   await request.patch('http://localhost:8080/api/v1/parametros/veredicto', {
  26  |     headers: { Authorization: `Bearer ${token}` },
  27  |     data: { umbral_pct: 40, ventana_meses: 12 },
  28  |   })
  29  | 
  30  |   await entrar(page, 'direccion@warhorse.mx')
> 31  |   await expect(page.getByRole('heading', { name: /tablero directivo/i })).toBeVisible()
      |                                                                           ^ Error: expect(locator).toBeVisible() failed
  32  | 
  33  |   // La unidad crítica (WH125) llega seleccionada con veredicto Vender y la
  34  |   // razón textual calculada por el backend (RF-DASH-04)
  35  |   await expect(page.getByText('Vender / dar de baja')).toBeVisible()
  36  |   await expect(page.getByText(/ya representa el 45% del valor estimado del tracto \(\$210,000\)/)).toBeVisible()
  37  |   await expect(page.getByText(/67% de sus liberaciones fueron "mejoralito"/)).toBeVisible()
  38  |   await expect(page.getByText(/Umbral 40% · Ventana 12 meses/)).toBeVisible()
  39  | 
  40  |   // Clic en otra barra re-consulta el análisis de esa unidad
  41  |   await page.getByRole('button', { name: /wh101/i }).click({ force: true })
  42  |   await expect(page.getByText('Mantener')).toBeVisible()
  43  |   await expect(page.getByText(/debajo del umbral del 40%/)).toBeVisible()
  44  | 
  45  |   // RF-DASH-05: subir el umbral a 50% recalcula el veredicto de WH125
  46  |   await page.getByRole('button', { name: /wh125/i }).click({ force: true })
  47  |   await expect(page.getByText('Vender / dar de baja')).toBeVisible()
  48  |   await page.getByRole('button', { name: /ajustar parámetros/i }).click({ force: true })
  49  |   const modal = page.getByRole('dialog', { name: /ajustar parámetros/i })
  50  |   await modal.getByLabel(/umbral/i).fill('50')
  51  |   await modal.getByRole('button', { name: /guardar/i }).click({ force: true })
  52  |   await expect(page.getByText(/Parámetros actualizados — veredictos recalculados/)).toBeVisible()
  53  |   await expect(page.getByText('Mantener')).toBeVisible()
  54  |   await expect(page.getByText(/Umbral 50% · Ventana 12 meses/)).toBeVisible()
  55  | 
  56  |   // De regreso a 40 para dejar la BD como la sembró el globalSetup
  57  |   // (esperando a que el toast deje de tapar el botón)
  58  |   await expect(page.getByText(/Parámetros actualizados — veredictos recalculados/)).toBeHidden()
  59  |   await page.getByRole('button', { name: /ajustar parámetros/i }).click({ force: true })
  60  |   await expect(modal).toBeVisible()
  61  |   await modal.getByLabel(/umbral/i).fill('40')
  62  |   await modal.getByRole('button', { name: /guardar/i }).click({ force: true })
  63  |   await expect(page.getByText('Vender / dar de baja')).toBeVisible()
  64  | 
  65  |   // Ficha completa real (RF-FIC-01..03): historial y pieza Yonke estimada
  66  |   await page.getByRole('button', { name: /ver ficha completa/i }).click({ force: true })
  67  |   await expect(page.getByRole('heading', { name: /ficha · wh125/i })).toBeVisible()
  68  |   await expect(page.getByText('Transmisión tronada')).toBeVisible()
  69  |   await expect(page.getByText('86 días')).toBeVisible()
  70  |   await expect(page.getByText('Caja de transmisión')).toBeVisible()
  71  |   await expect(page.getByText(/donada por WH60/i)).toBeVisible()
  72  | })
  73  | 
  74  | test('diésel: Greisy aterriza en su pantalla y registra una carga real', async ({ page, request }) => {
  75  |   await entrar(page, 'greisy@warhorse.mx')
  76  | 
  77  |   // Landing por rol (RF-USR-03) + nav filtrado
  78  |   await expect(page.getByRole('heading', { name: /control de diésel/i })).toBeVisible()
  79  |   const nav = page.getByRole('navigation')
  80  |   await expect(nav.getByRole('button', { name: 'Diésel' })).toBeVisible()
  81  |   await expect(nav.getByRole('button', { name: 'Tablero' })).toHaveCount(0)
  82  | 
  83  |   // Captura (RF-DIE-01): CJ12 no participa en el ranking del dashboard
  84  |   await page.getByRole('combobox', { name: 'Unidad' }).selectOption({ label: 'CJ12 · Caja' })
  85  |   await page.getByLabel(/fecha de la carga/i).fill('2026-07-08')
  86  |   await page.getByLabel(/litros/i).fill('120.5')
  87  |   await page.getByLabel(/costo total/i).fill('3072.75')
  88  |   await page.getByLabel(/kilómetros recorridos/i).fill('265')
  89  |   await page.getByRole('button', { name: /registrar carga/i }).click({ force: true })
  90  |   await expect(page.getByText(/Carga registrada — el consolidado de CJ12 ya la refleja/)).toBeVisible()
  91  |   await expect(page.getByRole('row', { name: /CJ12/ }).first()).toBeVisible()
  92  | 
  93  |   // RF-DIE-02 server-side: el consolidado de CJ12 subió exactamente el costo
  94  |   const login = await request.post('http://localhost:8080/api/v1/auth/login', {
  95  |     data: { email: 'direccion@warhorse.mx', password: 'warhorse-demo' },
  96  |   })
  97  |   const { token } = await login.json()
  98  |   const unidades = await request.get('http://localhost:8080/api/v1/unidades?per_page=100', {
  99  |     headers: { Authorization: `Bearer ${token}` },
  100 |   })
  101 |   const { data } = await unidades.json()
  102 |   const cj12 = data.find((u: { id_unidad: string }) => u.id_unidad === 'CJ12')
  103 |   // Sembrado: 0 + 2100 + 1400 = 3500; con la carga: 3500 + 3072.75
  104 |   expect(cj12.costo_real_acumulado).toBeCloseTo(6572.75, 2)
  105 | })
  106 | 
```