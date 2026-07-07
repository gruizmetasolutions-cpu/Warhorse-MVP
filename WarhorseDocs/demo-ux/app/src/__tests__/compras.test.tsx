import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { AppRoutes } from '../routes'
import { SesionProvider } from '../lib/session'
import { ToastProvider } from '../components/Toast'

const entrarComoCompras = async () => {
  render(
    <SesionProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={['/login']}>
          <AppRoutes />
        </MemoryRouter>
      </ToastProvider>
    </SesionProvider>,
  )
  await userEvent.click(await screen.findByRole('button', { name: /^compras/i }))
  await userEvent.click(screen.getByRole('button', { name: /arrancar/i }))
  await screen.findByRole('heading', { name: /panel de compras/i })
  await screen.findByText('Compresora de aire')
}

test('una requisición Yonke Solicitada salta a Instalado con confirmación (RF-COM-03)', async () => {
  await entrarComoCompras()
  const fila = screen.getByText('Compresora de aire').closest('tr')!
  expect(within(fila).getByText('Yonke')).toBeInTheDocument()
  expect(within(fila).getByText('Estimado')).toBeInTheDocument()
  await userEvent.click(within(fila).getByRole('button', { name: /confirmar instalación/i }))
  const dialogo = await screen.findByRole('dialog', { name: /confirmar instalación/i })
  expect(within(dialogo).getByText(/donante WH60/i)).toBeInTheDocument()
  await userEvent.click(within(dialogo).getByRole('button', { name: /^confirmar$/i }))
  await waitFor(() => {
    const filaFinal = screen.getByText('Compresora de aire').closest('tr')!
    expect(within(filaFinal).getByText('Instalado')).toBeInTheDocument()
  })
})

test('una requisición de Compra exige costo real y factura para Comprado (RF-COM-02)', async () => {
  await entrarComoCompras()
  const fila = screen.getByText('Balatas delanteras').closest('tr')!
  await userEvent.click(within(fila).getByRole('button', { name: /registrar compra/i }))
  const dialogo = await screen.findByRole('dialog', { name: /registrar compra/i })
  await userEvent.click(within(dialogo).getByRole('button', { name: /^registrar$/i }))
  expect(
    await within(dialogo).findByText('Falta el costo real y el número de factura.'),
  ).toBeInTheDocument()
  await userEvent.type(within(dialogo).getByLabelText(/costo real/i), '5200')
  await userEvent.type(within(dialogo).getByLabelText(/número de factura/i), 'F-10233')
  await userEvent.click(within(dialogo).getByRole('button', { name: /^registrar$/i }))
  await waitFor(() => {
    const filaFinal = screen.getByText('Balatas delanteras').closest('tr')!
    expect(within(filaFinal).getByText('Comprado')).toBeInTheDocument()
  })
})

test('el filtro por estado deja solo las requisiciones de ese estado (RF-COM-01)', async () => {
  await entrarComoCompras()
  await userEvent.click(screen.getByRole('button', { name: 'Solicitado' }))
  expect(await screen.findByText('Filtro de aire')).toBeInTheDocument()
  expect(screen.queryByText('Turbo')).not.toBeInTheDocument()
})
