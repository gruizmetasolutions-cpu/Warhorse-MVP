import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router'
import { AppRoutes } from '../routes'
import { SesionProvider } from '../lib/session'
import { ToastProvider } from '../components/Toast'

function IrA({ ruta }: { ruta: string }) {
  const navigate = useNavigate()
  return <button onClick={() => navigate(ruta)}>ir-a-prueba</button>
}

const montar = (rutaInicial = '/login', extra?: string) =>
  render(
    <SesionProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={[rutaInicial]}>
          <AppRoutes />
          {extra && <IrA ruta={extra} />}
        </MemoryRouter>
      </ToastProvider>
    </SesionProvider>,
  )

test('sin sesión, /dashboard redirige al login', async () => {
  montar('/dashboard')
  expect(await screen.findByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument()
})

test('admin aterriza en el tablero', async () => {
  montar('/login')
  await userEvent.click(await screen.findByRole('button', { name: /dirección/i }))
  expect(await screen.findByRole('heading', { name: /tablero/i })).toBeInTheDocument()
})

test('taller aterriza en requisición y /compras lo regresa a su landing', async () => {
  montar('/login', '/compras')
  await userEvent.click(await screen.findByRole('button', { name: /taller/i }))
  expect(await screen.findByRole('heading', { name: /requisición/i })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'ir-a-prueba' }))
  expect(await screen.findByRole('heading', { name: /requisición/i })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: /panel de compras/i })).not.toBeInTheDocument()
})

test('compras aterriza en su panel', async () => {
  montar('/login')
  await userEvent.click(await screen.findByRole('button', { name: /compras/i }))
  expect(await screen.findByRole('heading', { name: /panel de compras/i })).toBeInTheDocument()
})

test('el nav de taller solo muestra Requisición y Catálogo', async () => {
  montar('/login')
  await userEvent.click(await screen.findByRole('button', { name: /taller/i }))
  await screen.findByRole('heading', { name: /requisición/i })
  const enlaces = screen.getAllByRole('link').map((a) => a.textContent)
  expect(enlaces.join(' ')).toMatch(/Requisición/)
  expect(enlaces.join(' ')).toMatch(/Catálogo/)
  expect(enlaces.join(' ')).not.toMatch(/Compras|Tablero|Usuarios/)
})
