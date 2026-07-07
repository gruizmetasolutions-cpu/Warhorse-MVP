import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import App from '../routes'

export const montarApp = (rutaInicial = '/login') =>
  render(
    <MemoryRouter initialEntries={[rutaInicial]}>
      <App />
    </MemoryRouter>,
  )

// El login del demo: seleccionar la tarjeta del rol y "Arrancar →".
export const entrarComo = async (rol: RegExp) => {
  await userEvent.click(await screen.findByRole('button', { name: rol }))
  await userEvent.click(screen.getByRole('button', { name: /arrancar →/i }))
}
