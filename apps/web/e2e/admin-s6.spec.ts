import { expect, test, type Page } from '@playwright/test'

// Sprint 6 — E2E de administración: alta de usuario real (RF-USR-01),
// verificación server-side de que el evento quedó en la bitácora (RF-INT-05)
// y tarjeta de salud de datos en el Tablero (SRS §9).

const entrar = async (page: Page, email: string) => {
  await page.addInitScript(() => localStorage.setItem('wh_tour_v1', 'done'))
  await page.goto('/login')
  await page.getByPlaceholder('Usuario o correo').fill(email)
  await page.getByPlaceholder('Contraseña').fill('warhorse-demo')
  await page.getByRole('button', { name: /arrancar/i }).click()
}

test('admin: alta de usuario, auditoría server-side y salud de datos', async ({ page, request }, testInfo) => {
  const correo = `nadia.e2e.${Date.now()}.${testInfo.retry}@warhorse.mx`
  await entrar(page, 'direccion@warhorse.mx')
  await expect(page.getByRole('heading', { name: /tablero directivo/i })).toBeVisible()

  // Tarjeta de salud de datos (SRS §9)
  await expect(page.getByRole('heading', { name: /salud de datos/i })).toBeVisible()
  await expect(page.getByText(/Requisiciones con foto y origen/i)).toBeVisible()

  // Alta de usuario real desde la UI (RF-USR-01)
  await page.getByRole('navigation').getByRole('button', { name: 'Usuarios' }).click()
  await expect(page.getByRole('heading', { name: /usuarios y permisos/i })).toBeVisible()
  await page.getByPlaceholder(/nombre del nuevo usuario/i).fill('Nadia E2E')
  await page.getByPlaceholder(/correo del nuevo usuario/i).fill(correo)
  await page.getByRole('button', { name: /\+ agregar/i }).click({ force: true })
  // Nuevo flujo sin correo: tarjeta con la temporal, cerramos con "Entendido"
  const tarjeta = page.getByRole('dialog', { name: /credenciales de/i })
  await expect(tarjeta).toBeVisible()
  await tarjeta.getByRole('button', { name: /entendido/i }).click({ force: true })
  await expect(page.getByText(correo)).toBeVisible()

  // RF-INT-05: el alta quedó en la bitácora, consultable por Dirección
  const login = await request.post('http://localhost:8080/api/v1/auth/login', {
    data: { email: 'direccion@warhorse.mx', password: 'warhorse-demo' },
  })
  const { token } = await login.json()
  const bitacora = await request.get('http://localhost:8080/api/v1/auditoria?entidad=usuarios&accion=usuario.alta', {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(bitacora.status()).toBe(200)
  const { data } = await bitacora.json()
  const evento = data.find((e: { valor_nuevo?: { email?: string } }) => e.valor_nuevo?.email === correo)
  expect(evento).toBeTruthy()
  expect(evento.actor).toBe('Dirección WarHorse')
})
