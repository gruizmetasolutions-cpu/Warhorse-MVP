import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { entrarComo, montarApp as montar } from './util'

test('sin sesión, /dashboard redirige al login', async () => {
  montar('/dashboard')
  expect(await screen.findByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument()
})

test('admin aterriza en el tablero', async () => {
  montar('/login')
  await entrarComo(/dirección/i)
  expect(await screen.findByRole('heading', { name: /tablero/i })).toBeInTheDocument()
})

test('taller aterriza en requisición y /compras lo regresa a su landing', async () => {
  montar('/login', '/compras')
  await entrarComo(/taller/i)
  expect(await screen.findByRole('heading', { name: /requisición/i })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'ir-a-prueba' }))
  expect(await screen.findByRole('heading', { name: /requisición/i })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: /panel de compras/i })).not.toBeInTheDocument()
})

test('compras aterriza en su panel', async () => {
  montar('/login')
  await entrarComo(/^compras/i)
  expect(await screen.findByRole('heading', { name: /panel de compras/i })).toBeInTheDocument()
})

test('el nav de taller solo muestra Requisición y Catálogo', async () => {
  montar('/login')
  await entrarComo(/taller/i)
  await screen.findByRole('heading', { name: /requisición/i })
  const enlaces = screen.getAllByRole('link').map((a) => a.textContent)
  expect(enlaces.join(' ')).toMatch(/Requisición/)
  expect(enlaces.join(' ')).toMatch(/Catálogo/)
  expect(enlaces.join(' ')).not.toMatch(/Compras|Tablero|Usuarios/)
})
