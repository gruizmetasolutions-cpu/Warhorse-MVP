import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { entrarComo, montarApp } from './util'

// Auth real desde el Sprint 1: en unit tests se mockea la capa lib/api
// (login/me/logout); getDatos sigue siendo el mock del demo.
vi.mock('../lib/api', async (importOriginal) => {
  const real = await importOriginal<typeof import('../lib/api')>()
  const PERMISOS: Record<string, Record<string, boolean>> = {
    admin: { dashboard: true, requisicion: true, taller: true, compras: true, catalogo: true, diesel: true, usuarios: true },
    taller: { dashboard: false, requisicion: true, taller: true, compras: false, catalogo: true, diesel: false, usuarios: false },
    compras: { dashboard: false, requisicion: false, taller: false, compras: true, catalogo: true, diesel: false, usuarios: false },
    diesel: { dashboard: false, requisicion: false, taller: false, compras: false, catalogo: true, diesel: true, usuarios: false },
  }
  const USUARIOS: Record<string, { rol: string; nombre: string; landing: string }> = {
    'direccion@warhorse.mx': { rol: 'admin', nombre: 'Dirección WarHorse', landing: 'dashboard' },
    'edgar@warhorse.mx': { rol: 'taller', nombre: 'Edgar Fraga', landing: 'requisicion' },
    'montzay@warhorse.mx': { rol: 'compras', nombre: 'Montzay Vázquez', landing: 'compras' },
    'greisy@warhorse.mx': { rol: 'diesel', nombre: 'Greisy López', landing: 'diesel' },
  }
  let actual: string | null = null
  const unidadesFake = [
    { id: 10, id_unidad: 'WH101', tipo: 'Tractor', estado: 'Activo', valor_referencia: 480000, costo_real_acumulado: 45000, candidata_reincidencia: false },
    { id: 11, id_unidad: 'WH104', tipo: 'Tractor', estado: 'Activo', valor_referencia: 520000, costo_real_acumulado: 46700, candidata_reincidencia: false },
    { id: 12, id_unidad: 'WH118', tipo: 'Tractor', estado: 'Activo', valor_referencia: 350000, costo_real_acumulado: 49600, candidata_reincidencia: false },
    { id: 13, id_unidad: 'WH125', tipo: 'Tractor', estado: 'Activo', valor_referencia: 210000, costo_real_acumulado: 93500, candidata_reincidencia: true },
    { id: 14, id_unidad: 'WH210', tipo: 'Tractor', estado: 'Activo', valor_referencia: 610000, costo_real_acumulado: 35800, candidata_reincidencia: false },
    { id: 3, id_unidad: 'WH03', tipo: 'Tractor', estado: 'Yonke', valor_referencia: null, costo_real_acumulado: 0, candidata_reincidencia: false },
    { id: 4, id_unidad: 'WH60', tipo: 'Tractor', estado: 'Yonke', valor_referencia: null, costo_real_acumulado: 0, candidata_reincidencia: false },
    { id: 5, id_unidad: 'CJ12', tipo: 'Caja', estado: 'Activo', valor_referencia: 180000, costo_real_acumulado: 3500, candidata_reincidencia: false },
    { id: 6, id_unidad: 'CJ07', tipo: 'Caja', estado: 'Inactivo', valor_referencia: 90000, costo_real_acumulado: 0, candidata_reincidencia: false },
  ]
  return {
    ...real,
    getUnidades: async (estado?: string) =>
      unidadesFake.filter((u) => !estado || u.estado === estado),
    crearUnidad: async (datos: { id_unidad: string; tipo: string; estado: string; valor_referencia: number | null }) => {
      if (unidadesFake.some((u) => u.id_unidad === datos.id_unidad)) {
        throw new real.ApiError(409, 'conflict', 'Ya existe una unidad con ese ID.')
      }
      const nueva = { id: 100 + unidadesFake.length, id_unidad: datos.id_unidad, tipo: datos.tipo, estado: datos.estado, valor_referencia: datos.valor_referencia, costo_real_acumulado: 0, candidata_reincidencia: false }
      unidadesFake.push(nueva)
      return nueva
    },
    actualizarUnidad: async (id: number, cambio: { estado?: string; valor_referencia?: number }) => {
      const u = unidadesFake.find((x) => x.id === id)
      if (!u) throw new real.ApiError(404, 'not_found', 'Unidad no encontrada.')
      if (cambio.estado && u.estado === 'Inactivo') {
        throw new real.ApiError(409, 'conflict', `Transición ilegal de estado: Inactivo → ${cambio.estado}.`)
      }
      Object.assign(u, cambio)
      return u
    },
    login: async (email: string, password: string) => {
      const u = USUARIOS[email]
      if (!u || password !== 'warhorse-demo') {
        throw new real.ApiError(401, 'unauthenticated', 'Credenciales inválidas.')
      }
      actual = email
      return { token: 'token-prueba', usuario: { id: 1, nombre: u.nombre, rol: u.rol }, landing: u.landing }
    },
    me: async () => {
      const u = USUARIOS[actual ?? '']
      return { id: 1, nombre: u.nombre, rol: u.rol, permisos: PERMISOS[u.rol], landing: u.landing }
    },
    logout: async () => {
      actual = null
    },
    haySesion: () => actual !== null,
  }
})

test('Dirección aterriza en el Tablero', async () => {
  montarApp()
  await entrarComo('direccion@warhorse.mx')
  expect(await screen.findByRole('heading', { name: /tablero directivo/i })).toBeInTheDocument()
})

test('Taller aterriza en Requisición', async () => {
  montarApp()
  await entrarComo('edgar@warhorse.mx')
  expect(await screen.findByRole('heading', { name: /requisición de refacciones/i })).toBeInTheDocument()
})

test('Compras aterriza en su Panel', async () => {
  montarApp()
  await entrarComo('montzay@warhorse.mx')
  expect(await screen.findByRole('heading', { name: /panel de compras/i })).toBeInTheDocument()
})

test('el tablero muestra la decisión Vender para WH125 y Mantener al seleccionar WH101', async () => {
  montarApp()
  await entrarComo('direccion@warhorse.mx')
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
  await entrarComo('direccion@warhorse.mx')
  await screen.findByText('Vender / dar de baja')
  await userEvent.click(screen.getByRole('button', { name: /ver ficha completa/i }))
  expect(await screen.findByRole('heading', { name: /ficha · wh125/i })).toBeInTheDocument()
  expect(screen.getByText('Transmisión tronada')).toBeInTheDocument()
  expect(screen.getByText('86 días')).toBeInTheDocument()
  expect(screen.getByText(/donada por WH60/i)).toBeInTheDocument()
})

test('la ficha de una unidad Yonke muestra sus piezas donadas', async () => {
  montarApp()
  await entrarComo('direccion@warhorse.mx')
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
  await entrarComo('edgar@warhorse.mx')
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
  await entrarComo('montzay@warhorse.mx')
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
  await entrarComo('direccion@warhorse.mx')
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
  await entrarComo('direccion@warhorse.mx')
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

test('login inválido muestra "Credenciales inválidas." (RF-AUTH-01)', async () => {
  montarApp()
  await entrarComo('direccion@warhorse.mx', 'contraseña-mala')
  expect(await screen.findByText('Credenciales inválidas.')).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: /tablero directivo/i })).not.toBeInTheDocument()
})

test('el nav de taller solo muestra sus módulos y /compras lo regresa a su landing (RF-USR-03)', async () => {
  montarApp('/login', '/compras')
  await entrarComo('edgar@warhorse.mx')
  await screen.findByRole('heading', { name: /requisición de refacciones/i })
  const nav = screen.getByRole('navigation')
  expect(within(nav).getByRole('button', { name: 'Requisición' })).toBeInTheDocument()
  expect(within(nav).getByRole('button', { name: 'Catálogo' })).toBeInTheDocument()
  expect(within(nav).queryByRole('button', { name: 'Compras' })).not.toBeInTheDocument()
  expect(within(nav).queryByRole('button', { name: 'Tablero' })).not.toBeInTheDocument()
  expect(within(nav).queryByRole('button', { name: 'Usuarios' })).not.toBeInTheDocument()
  // Guarda de módulo: intentar entrar a /compras lo regresa a su vista
  await userEvent.click(screen.getByRole('button', { name: 'ir-a-prueba' }))
  expect(await screen.findByRole('heading', { name: /requisición de refacciones/i })).toBeInTheDocument()
})

test('sin sesión, cualquier ruta protegida redirige al login', async () => {
  montarApp('/dashboard')
  expect(await screen.findByRole('heading', { name: /entrar al hub/i })).toBeInTheDocument()
})

test('Salir cierra la sesión y regresa al login (RF-AUTH-03)', async () => {
  montarApp()
  await entrarComo('direccion@warhorse.mx')
  await screen.findByRole('heading', { name: /tablero directivo/i })
  await userEvent.click(screen.getByRole('button', { name: /salir/i }))
  expect(await screen.findByRole('heading', { name: /entrar al hub/i })).toBeInTheDocument()
})

test('catálogo: admin da de alta una unidad y aparece en la tabla y el selector (RF-UNI-01/02)', async () => {
  montarApp()
  await entrarComo('direccion@warhorse.mx')
  await screen.findByRole('heading', { name: /tablero directivo/i })
  await userEvent.click(screen.getByRole('button', { name: 'Catálogo' }))
  await screen.findByRole('heading', { name: /catálogo de unidades/i })

  await userEvent.click(screen.getByRole('button', { name: /\+ agregar unidad/i }))
  const dialogo = await screen.findByRole('dialog', { name: /agregar unidad/i })
  await userEvent.type(within(dialogo).getByLabelText(/id de la unidad/i), 'WH300')
  await userEvent.type(within(dialogo).getByLabelText(/fecha de alta/i), '2026-07-07')
  await userEvent.click(within(dialogo).getByRole('button', { name: /guardar/i }))

  expect(await screen.findByText('WH300 dada de alta en la flota')).toBeInTheDocument()
  expect(await screen.findByText('WH300')).toBeInTheDocument()

  // Propagación al selector de Requisición (catálogo vivo)
  await userEvent.click(screen.getByRole('button', { name: 'Requisición' }))
  await screen.findByRole('heading', { name: /requisición de refacciones/i })
  expect(screen.getByRole('option', { name: /WH300 · Tractor/i })).toBeInTheDocument()
})

test('catálogo: alta duplicada muestra el 409 del backend', async () => {
  montarApp()
  await entrarComo('direccion@warhorse.mx')
  await screen.findByRole('heading', { name: /tablero directivo/i })
  await userEvent.click(screen.getByRole('button', { name: 'Catálogo' }))
  await userEvent.click(await screen.findByRole('button', { name: /\+ agregar unidad/i }))
  const dialogo = await screen.findByRole('dialog', { name: /agregar unidad/i })
  await userEvent.type(within(dialogo).getByLabelText(/id de la unidad/i), 'WH125')
  await userEvent.type(within(dialogo).getByLabelText(/fecha de alta/i), '2026-07-07')
  await userEvent.click(within(dialogo).getByRole('button', { name: /guardar/i }))
  expect(await within(dialogo).findByText(/ya existe una unidad/i)).toBeInTheDocument()
})

test('catálogo: taller NO ve los controles de admin', async () => {
  montarApp()
  await entrarComo('edgar@warhorse.mx')
  await screen.findByRole('heading', { name: /requisición de refacciones/i })
  await userEvent.click(screen.getByRole('button', { name: 'Catálogo' }))
  await screen.findByRole('heading', { name: /catálogo de unidades/i })
  expect(screen.queryByRole('button', { name: /\+ agregar unidad/i })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /^editar$/i })).not.toBeInTheDocument()
})
