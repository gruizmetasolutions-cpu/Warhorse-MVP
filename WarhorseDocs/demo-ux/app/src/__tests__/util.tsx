import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router'
import { AppRoutes } from '../routes'
import { SesionProvider } from '../lib/session'
import { ToastProvider } from '../components/Toast'
import { EscenarioProvider } from '../lib/escenario'

export function IrA({ ruta }: { ruta: string }) {
  const navigate = useNavigate()
  return <button onClick={() => navigate(ruta)}>ir-a-prueba</button>
}

export const montarApp = (rutaInicial = '/login', extra?: string) =>
  render(
    <SesionProvider>
      <ToastProvider>
        <EscenarioProvider>
          <MemoryRouter initialEntries={[rutaInicial]}>
            <AppRoutes />
            {extra && <IrA ruta={extra} />}
          </MemoryRouter>
        </EscenarioProvider>
      </ToastProvider>
    </SesionProvider>,
  )

export const entrarComo = async (rol: RegExp) => {
  await userEvent.click(await screen.findByRole('button', { name: rol }))
  await userEvent.click(screen.getByRole('button', { name: /arrancar/i }))
}
