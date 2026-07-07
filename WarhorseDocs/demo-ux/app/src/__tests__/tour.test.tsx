import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { entrarComo, montarApp } from './util'

test('el tour se dispara en el primer ingreso, es saltable y repetible (RF-AUTH-04)', async () => {
  localStorage.clear()
  montarApp('/login')
  await entrarComo(/dirección/i)
  await screen.findByRole('heading', { name: /tablero directivo/i })

  // Primer ingreso: aparece solo
  const dialogo = await screen.findByRole('dialog', { name: /tutorial, paso 1/i })
  expect(dialogo).toBeInTheDocument()

  // Saltable en cualquier paso; queda persistido como visto
  await userEvent.click(screen.getByRole('button', { name: /saltar/i }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(localStorage.getItem('wh-tour-visto-admin')).toBe('1')

  // Repetible desde el botón Tutorial del nav
  await userEvent.click(screen.getByRole('button', { name: /tutorial/i }))
  expect(await screen.findByRole('dialog', { name: /tutorial, paso 1/i })).toBeInTheDocument()

  // Recorre los 5 pasos del rol Dirección hasta Terminar
  for (let paso = 1; paso < 5; paso++) {
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
  }
  await userEvent.click(screen.getByRole('button', { name: /terminar/i }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})

test('el escenario "vacío" muestra el estado empty del catálogo con el camión de firma', async () => {
  const { setEscenario } = await import('../lib/mock/scenarios')
  setEscenario('vacio')
  montarApp('/login', '/catalogo')
  await entrarComo(/dirección/i)
  await screen.findByRole('heading', { name: /tablero directivo/i })
  await userEvent.click(screen.getByRole('button', { name: 'ir-a-prueba' }))
  expect(await screen.findByText('Aún no hay unidades en esta vista')).toBeInTheDocument()
  setEscenario('normal')
})

test('el escenario "error" muestra el estado de error con Reintentar', async () => {
  const { setEscenario } = await import('../lib/mock/scenarios')
  setEscenario('error')
  montarApp('/login', '/catalogo')
  await entrarComo(/dirección/i)
  await userEvent.click(await screen.findByRole('button', { name: 'ir-a-prueba' }))
  expect(await screen.findByText('No se pudieron cargar los datos.')).toBeInTheDocument()
  setEscenario('normal')
  await userEvent.click(screen.getByRole('button', { name: /reintentar/i }))
  expect(await screen.findByText('WH125')).toBeInTheDocument()
})
