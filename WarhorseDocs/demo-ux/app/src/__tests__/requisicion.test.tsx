import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { entrarComo, montarApp } from './util'

const entrarComoTaller = async () => {
  montarApp('/login')
  await entrarComo(/taller/i)
  await screen.findByRole('heading', { name: /requisición de refacciones/i })
}

test('enviar sin foto muestra el mensaje verbatim del demo', async () => {
  await entrarComoTaller()
  await screen.findByLabelText(/tracto destino/i)
  await userEvent.selectOptions(screen.getByLabelText(/tracto destino/i), '12')
  await userEvent.type(screen.getByLabelText(/descripción de la pieza/i), 'Sensor de nivel')
  await userEvent.click(screen.getByRole('button', { name: /enviar requisición/i }))
  expect(
    await screen.findByText('La foto de la pieza o número de serie es obligatoria.'),
  ).toBeInTheDocument()
})

test('alternar a Yonke muestra donante y costo estimado (RF-REQ-05)', async () => {
  await entrarComoTaller()
  expect(screen.queryByLabelText(/unidad donante/i)).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Yonke' }))
  expect(screen.getByLabelText(/unidad donante/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/costo estimado/i)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Compra' }))
  expect(screen.queryByLabelText(/unidad donante/i)).not.toBeInTheDocument()
})

test('una requisición Yonke completa se envía y muestra el toast', async () => {
  await entrarComoTaller()
  await screen.findByLabelText(/tracto destino/i)
  await userEvent.selectOptions(screen.getByLabelText(/tracto destino/i), '12')
  await userEvent.click(screen.getByRole('button', { name: 'Yonke' }))
  await userEvent.selectOptions(screen.getByLabelText(/unidad donante/i), '3')
  await userEvent.type(screen.getByLabelText(/costo estimado/i), '1500')
  await userEvent.type(screen.getByLabelText(/descripción de la pieza/i), 'Marcha')
  await userEvent.click(screen.getByRole('button', { name: /adjuntar foto simulada/i }))
  await userEvent.click(screen.getByRole('button', { name: /enviar requisición/i }))
  expect(
    await screen.findByText('Requisición enviada — Compras la verá en su panel'),
  ).toBeInTheDocument()
})

test('Yonke sin donante muestra el error verbatim en su campo', async () => {
  await entrarComoTaller()
  await screen.findByLabelText(/tracto destino/i)
  await userEvent.selectOptions(screen.getByLabelText(/tracto destino/i), '12')
  await userEvent.click(screen.getByRole('button', { name: 'Yonke' }))
  await userEvent.type(screen.getByLabelText(/descripción de la pieza/i), 'Turbo')
  await userEvent.click(screen.getByRole('button', { name: /adjuntar foto simulada/i }))
  await userEvent.click(screen.getByRole('button', { name: /enviar requisición/i }))
  expect(
    await screen.findByText('El origen Yonke obliga a registrar la unidad donante.'),
  ).toBeInTheDocument()
})
