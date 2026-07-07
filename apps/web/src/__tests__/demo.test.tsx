import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { entrarComo, montarApp } from './util'

test('Dirección aterriza en el Tablero', async () => {
  montarApp()
  await entrarComo(/dirección/i)
  expect(await screen.findByRole('heading', { name: /tablero directivo/i })).toBeInTheDocument()
})

test('Taller aterriza en Requisición', async () => {
  montarApp()
  await entrarComo(/edgar fraga/i)
  expect(await screen.findByRole('heading', { name: /requisición de refacciones/i })).toBeInTheDocument()
})

test('Compras aterriza en su Panel', async () => {
  montarApp()
  await entrarComo(/montzay vázquez/i)
  expect(await screen.findByRole('heading', { name: /panel de compras/i })).toBeInTheDocument()
})

test('el tablero muestra la decisión Vender para WH125 y Mantener al seleccionar WH101', async () => {
  montarApp()
  await entrarComo(/dirección/i)
  expect(await screen.findByText('Vender / dar de baja')).toBeInTheDocument()
  expect(screen.getByText(/ya representa el 45% del valor estimado del tracto/)).toBeInTheDocument()
  expect(screen.getByText(/67% de sus liberaciones fueron "mejoralito"/)).toBeInTheDocument()
  // KPI consolidado de los 5 tractos activos
  expect(screen.getByText('$270,600')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /wh101/i }))
  expect(await screen.findByText('Mantener')).toBeInTheDocument()
})

test('Ver ficha completa abre la ficha de WH125 con su historial', async () => {
  montarApp()
  await entrarComo(/dirección/i)
  await screen.findByText('Vender / dar de baja')
  await userEvent.click(screen.getByRole('button', { name: /ver ficha completa/i }))
  expect(await screen.findByRole('heading', { name: /ficha · wh125/i })).toBeInTheDocument()
  expect(screen.getByText('Transmisión tronada')).toBeInTheDocument()
  expect(screen.getByText('86 días')).toBeInTheDocument()
  expect(screen.getByText(/donada por WH60/i)).toBeInTheDocument()
})

test('la ficha de una unidad Yonke muestra sus piezas donadas', async () => {
  montarApp()
  await entrarComo(/dirección/i)
  await screen.findByText('Vender / dar de baja')
  await userEvent.click(screen.getByRole('button', { name: 'Catálogo' }))
  await userEvent.click(screen.getByRole('button', { name: 'Yonke' }))
  const filaWh03 = (await screen.findByText('WH03')).closest('tr')!
  await userEvent.click(within(filaWh03).getByRole('button', { name: /ver ficha/i }))
  expect(await screen.findByRole('heading', { name: /piezas donadas a otras unidades/i })).toBeInTheDocument()
  expect(screen.getByText('Turbo')).toBeInTheDocument()
})

test('requisición: validaciones verbatim y envío Yonke con toast', async () => {
  montarApp()
  await entrarComo(/edgar fraga/i)
  await screen.findByRole('heading', { name: /requisición de refacciones/i })

  await userEvent.click(screen.getByRole('button', { name: /enviar requisición/i }))
  expect(await screen.findByText('Selecciona el tracto destino.')).toBeInTheDocument()

  await userEvent.selectOptions(screen.getByLabelText(/tracto destino/i), 'WH125')
  await userEvent.type(screen.getByLabelText(/descripción de la pieza/i), 'Alternador')
  await userEvent.click(screen.getByRole('button', { name: /canibalizado de yonke/i }))
  await userEvent.click(screen.getByRole('button', { name: /enviar requisición/i }))
  expect(await screen.findByText('El origen Yonke obliga a registrar la unidad donante.')).toBeInTheDocument()

  await userEvent.selectOptions(screen.getByLabelText(/tracto donante/i), 'WH03')
  await userEvent.click(screen.getByRole('button', { name: /enviar requisición/i }))
  expect(
    await screen.findByText('Asigna un costo estimado a la pieza donada, aunque no exista factura.'),
  ).toBeInTheDocument()

  await userEvent.type(screen.getByLabelText(/costo estimado/i), '2800')
  await userEvent.click(screen.getByRole('button', { name: /enviar requisición/i }))
  expect(await screen.findByText('La foto de la pieza o número de serie es obligatoria.')).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: /toca para adjuntar/i }))
  await userEvent.click(screen.getByRole('button', { name: /enviar requisición/i }))
  expect(await screen.findByText('Requisición enviada — Compras la verá en su panel.')).toBeInTheDocument()
})

test('compras: Cotizado avanza directo y la instalación pide confirmación', async () => {
  montarApp()
  await entrarComo(/montzay vázquez/i)
  await screen.findByRole('heading', { name: /panel de compras/i })

  // Compra en Cotizado → Comprado sin modal
  const filaBalatas = screen.getByText('Balatas de freno').closest('tr')!
  await userEvent.click(within(filaBalatas).getByRole('button', { name: /→ comprado/i }))
  await waitFor(() => {
    const fila = screen.getByText('Balatas de freno').closest('tr')!
    expect(within(fila).getByText('Comprado')).toBeInTheDocument()
  })

  // Yonke Solicitado → Instalado con confirmación
  const filaAlternador = screen.getByText('Alternador').closest('tr')!
  await userEvent.click(within(filaAlternador).getByRole('button', { name: /→ instalado/i }))
  const dialogo = await screen.findByRole('dialog', { name: /confirmar instalación/i })
  expect(within(dialogo).getByText('Alternador')).toBeInTheDocument()
  await userEvent.click(within(dialogo).getByRole('button', { name: /sí, marcar instalada/i }))
  await waitFor(() => {
    const fila = screen.getByText('Alternador').closest('tr')!
    expect(within(fila).getByText('Instalado')).toBeInTheDocument()
  })
})

test('usuarios: suspender, agregar y candado del permiso Admin·Usuarios', async () => {
  montarApp()
  await entrarComo(/dirección/i)
  await screen.findByText('Vender / dar de baja')
  await userEvent.click(screen.getByRole('button', { name: 'Usuarios' }))
  await screen.findByRole('heading', { name: /usuarios y permisos/i })

  const filaKarla = screen.getByText('Karla Ortiz').closest('tr')!
  expect(within(filaKarla).getByText('Suspendido')).toBeInTheDocument()
  await userEvent.click(within(filaKarla).getByRole('button', { name: /reactivar/i }))
  await waitFor(() => {
    const fila = screen.getByText('Karla Ortiz').closest('tr')!
    expect(within(fila).getByText('Activo')).toBeInTheDocument()
  })

  await userEvent.type(screen.getByPlaceholderText(/nombre del nuevo usuario/i), 'Paola Ruiz')
  await userEvent.click(screen.getByRole('button', { name: /\+ agregar/i }))
  expect(await screen.findByText('Paola Ruiz')).toBeInTheDocument()

  await userEvent.click(screen.getByTitle('El Admin no puede perder acceso a Usuarios'))
  expect(await screen.findByText('El Admin siempre conserva acceso a Usuarios.')).toBeInTheDocument()
})

test('el tour se dispara en el primer ingreso y recorre las vistas', async () => {
  localStorage.clear()
  montarApp()
  await entrarComo(/dirección/i)
  expect(await screen.findByText('Bienvenido al Hub de Gastos')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /siguiente →/i }))
  expect(await screen.findByText('Paso 2 de 10')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /saltar tutorial/i }))
  await waitFor(() => expect(screen.queryByText(/paso 2 de 10/i)).not.toBeInTheDocument())
  expect(localStorage.getItem('wh_tour_v1')).toBe('done')

  // Repetible desde el botón Tutorial
  await userEvent.click(screen.getByRole('button', { name: /tutorial/i }))
  expect(await screen.findByText('Bienvenido al Hub de Gastos')).toBeInTheDocument()
})
