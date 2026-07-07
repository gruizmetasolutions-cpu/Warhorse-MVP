import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import Boton from '../components/Boton'
import Modal from '../components/Modal'
import Tabla, { type Columna } from '../components/Tabla'

const columnas: Columna<{ id: number; nombre: string }>[] = [
  { titulo: 'Nombre', render: (f) => f.nombre },
]

test('Tabla en error muestra mensaje y Reintentar', async () => {
  const onReintentar = vi.fn()
  render(
    <Tabla
      etiqueta="prueba"
      columnas={columnas}
      filas={null}
      cargando={false}
      error="No se pudieron cargar los datos"
      onReintentar={onReintentar}
      textoVacio="Sin registros en esta vista"
      claveFila={(f) => f.id}
    />,
  )
  expect(screen.getByText('No se pudieron cargar los datos')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /reintentar/i }))
  expect(onReintentar).toHaveBeenCalledOnce()
})

test('Tabla vacía muestra el estado vacío con su texto', () => {
  render(
    <Tabla
      etiqueta="prueba"
      columnas={columnas}
      filas={[]}
      cargando={false}
      error={null}
      onReintentar={() => {}}
      textoVacio="Sin registros en esta vista"
      claveFila={(f) => f.id}
    />,
  )
  expect(screen.getByText('Sin registros en esta vista')).toBeInTheDocument()
})

test('Modal cierra con Escape y atrapa el foco', async () => {
  const onCerrar = vi.fn()
  render(
    <Modal abierto titulo="Confirmar instalación" onCerrar={onCerrar} onConfirmar={() => {}} textoConfirmar="Confirmar">
      <p>¿Seguro?</p>
    </Modal>,
  )
  expect(screen.getByRole('dialog', { name: /confirmar instalación/i })).toBeInTheDocument()
  await userEvent.keyboard('{Escape}')
  expect(onCerrar).toHaveBeenCalled()
})

test('Boton deshabilitado no dispara onClick', async () => {
  const onClick = vi.fn()
  render(
    <Boton disabled onClick={onClick}>
      Enviar requisición
    </Boton>,
  )
  await userEvent.click(screen.getByRole('button', { name: /enviar requisición/i }))
  expect(onClick).not.toHaveBeenCalled()
})
