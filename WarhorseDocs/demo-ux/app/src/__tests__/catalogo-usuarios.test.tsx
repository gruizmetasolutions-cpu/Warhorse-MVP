import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { entrarComo, montarApp } from './util'

const entrarYNavegar = async (ruta: string) => {
  montarApp('/login', ruta)
  await entrarComo(/dirección/i)
  await screen.findByRole('heading', { name: /tablero directivo/i })
  await userEvent.click(screen.getByRole('button', { name: 'ir-a-prueba' }))
}

test('el filtro Yonke deja solo las unidades donantes (RF-UNI-04)', async () => {
  await entrarYNavegar('/catalogo')
  expect(await screen.findByText('WH125')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Yonke' }))
  await waitFor(() => {
    expect(screen.getByText('WH03')).toBeInTheDocument()
    expect(screen.getByText('WH60')).toBeInTheDocument()
    expect(screen.queryByText('WH125')).not.toBeInTheDocument()
  })
})

test('clic en una unidad navega a su ficha (RF-UNI-05)', async () => {
  await entrarYNavegar('/catalogo')
  await userEvent.click(await screen.findByText('WH125'))
  expect(await screen.findByRole('heading', { name: 'WH125' })).toBeInTheDocument()
  expect(await screen.findByText('Transmisión')).toBeInTheDocument()
})

test('suspender un usuario lo marca Suspendido (RF-USR-01)', async () => {
  await entrarYNavegar('/usuarios')
  await screen.findByText('Kevin Rafael Ávila')
  const fila = screen.getByText('Kevin Rafael Ávila').closest('tr')!
  await userEvent.click(within(fila).getByRole('button', { name: /suspender/i }))
  await waitFor(() => {
    const filaFinal = screen.getByText('Kevin Rafael Ávila').closest('tr')!
    expect(within(filaFinal).getByText('Suspendido')).toBeInTheDocument()
  })
})

test('agregar usuario lo suma a la tabla', async () => {
  await entrarYNavegar('/usuarios')
  await screen.findByText('Edgar Fraga')
  await userEvent.click(screen.getByRole('button', { name: /agregar usuario/i }))
  const dialogo = await screen.findByRole('dialog', { name: /agregar usuario/i })
  await userEvent.type(within(dialogo).getByLabelText(/nombre/i), 'Paola Ruiz')
  await userEvent.type(within(dialogo).getByLabelText(/correo/i), 'paola@warhorse.mx')
  await userEvent.selectOptions(within(dialogo).getByLabelText(/^rol$/i), 'compras')
  await userEvent.click(within(dialogo).getByRole('button', { name: /crear usuario/i }))
  expect(await screen.findByText('Paola Ruiz')).toBeInTheDocument()
})
