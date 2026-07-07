import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { AppRoutes } from '../routes'
import { SesionProvider } from '../lib/session'
import { ToastProvider } from '../components/Toast'

const entrarComoAdmin = async () => {
  render(
    <SesionProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={['/login']}>
          <AppRoutes />
        </MemoryRouter>
      </ToastProvider>
    </SesionProvider>,
  )
  await userEvent.click(await screen.findByRole('button', { name: /dirección/i }))
  await userEvent.click(screen.getByRole('button', { name: /arrancar/i }))
  await screen.findByRole('heading', { name: /tablero directivo/i })
}

test('el dashboard muestra KPIs, veredicto Vender y su razón', async () => {
  await entrarComoAdmin()
  expect(await screen.findByText('$1,940,000')).toBeInTheDocument()
  expect(await screen.findByText('Vender')).toBeInTheDocument()
  expect(screen.getByText(/por encima del umbral del 40%/)).toBeInTheDocument()
  expect(screen.getByText(/mejoralito: reincide/)).toBeInTheDocument()
})

test('cambiar el umbral recalcula el veredicto en runtime (RF-DASH-05)', async () => {
  await entrarComoAdmin()
  await screen.findByText('Vender')
  const umbral = screen.getByLabelText('Umbral (%)')
  await userEvent.clear(umbral)
  await userEvent.type(umbral, '55')
  await userEvent.click(screen.getByRole('button', { name: /aplicar/i }))
  expect(await screen.findByText('Evaluar')).toBeInTheDocument()
})

test('seleccionar otra barra cambia el análisis de unidad', async () => {
  await entrarComoAdmin()
  await screen.findByRole('heading', { name: /veredicto — WH125/i })
  await userEvent.click(screen.getByRole('button', { name: /WH118/i }))
  expect(await screen.findByRole('heading', { name: /veredicto — WH118/i })).toBeInTheDocument()
})
