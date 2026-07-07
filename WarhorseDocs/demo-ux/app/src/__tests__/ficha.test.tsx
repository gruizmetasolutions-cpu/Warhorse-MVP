import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { entrarComo, montarApp } from './util'

const entrarYNavegar = async (ruta: string) => {
  montarApp('/login', ruta)
  await entrarComo(/dirección/i)
  await screen.findByRole('heading', { name: /tablero directivo/i })
  await userEvent.click(screen.getByRole('button', { name: 'ir-a-prueba' }))
}

test('la ficha de WH125 muestra la reparación insignia y la pieza Yonke estimada', async () => {
  await entrarYNavegar('/ficha/WH125')
  expect(await screen.findByRole('heading', { name: 'WH125' })).toBeInTheDocument()
  expect(await screen.findByText('86')).toBeInTheDocument()
  expect(screen.getByText('Transmisión')).toBeInTheDocument()
  expect(screen.getAllByText('Estimado').length).toBeGreaterThan(0)
  expect(screen.getByText(/donada por WH03/i)).toBeInTheDocument()
})

test('la ficha de una unidad Yonke muestra sus piezas donadas (RF-FIC-04)', async () => {
  await entrarYNavegar('/ficha/WH03')
  expect(
    await screen.findByRole('heading', { name: /piezas donadas a otras unidades/i }),
  ).toBeInTheDocument()
  expect(await screen.findByText('Turbo')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'WH125' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: /historial de reparaciones/i })).not.toBeInTheDocument()
})

test('una unidad inexistente muestra el estado vacío', async () => {
  await entrarYNavegar('/ficha/WH999')
  expect(await screen.findByRole('heading', { name: /unidad no encontrada/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /ir al catálogo/i })).toBeInTheDocument()
})
