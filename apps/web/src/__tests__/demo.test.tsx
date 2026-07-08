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
  const reqsFake = [
    { id: 1, estado: 'Instalado', origen: 'Yonke', unidad_destino_id: 10, unidad_donante_id: 3, unidad_destino: 'WH101', unidad_donante: 'WH03', descripcion_pieza: 'Turbo', numero_parte: null, urgencia: 'Crítica', costo_estimado: 4500, origen_costo_estimado: 'catalogo', costo_real: null, foto_pieza_url: 'a.jpg', fecha_solicitud: '2026-06-20' },
    { id: 2, estado: 'Cotizado', origen: 'Compra', unidad_destino_id: 11, unidad_donante_id: null, unidad_destino: 'WH104', unidad_donante: null, descripcion_pieza: 'Balatas de freno', numero_parte: null, urgencia: 'Media', costo_estimado: null, origen_costo_estimado: null, costo_real: null, foto_pieza_url: 'b.jpg', fecha_solicitud: '2026-06-28' },
    { id: 3, estado: 'Comprado', origen: 'Compra', unidad_destino_id: 13, unidad_donante_id: null, unidad_destino: 'WH125', unidad_donante: null, descripcion_pieza: 'Kit de clutch', numero_parte: null, urgencia: 'Crítica', costo_estimado: null, origen_costo_estimado: null, costo_real: 6400, foto_pieza_url: 'c.jpg', fecha_solicitud: '2026-06-25' },
    { id: 4, estado: 'Solicitado', origen: 'Yonke', unidad_destino_id: 11, unidad_donante_id: 4, unidad_destino: 'WH104', unidad_donante: 'WH60', descripcion_pieza: 'Alternador', numero_parte: null, urgencia: 'Media', costo_estimado: 3200, origen_costo_estimado: 'catalogo', costo_real: null, foto_pieza_url: 'd.jpg', fecha_solicitud: '2026-06-30' },
    { id: 5, estado: 'Solicitado', origen: 'Compra', unidad_destino_id: 14, unidad_donante_id: null, unidad_destino: 'WH210', unidad_donante: null, descripcion_pieza: 'Filtros de aceite', numero_parte: null, urgencia: 'Rápida', costo_estimado: null, origen_costo_estimado: null, costo_real: null, foto_pieza_url: 'e.jpg', fecha_solicitud: '2026-06-30' },
  ]
  const registrosFake: Array<{ id: number; unidad_id: number; id_unidad: string; fecha_ingreso: string; fecha_salida: string | null; dias_en_taller: number | null; diagnostico: string; criticidad: string; costo_taller: number; tipo_liberacion: string | null; pendientes: string[] | null; es_reincidencia: boolean }> = [
    { id: 800, unidad_id: 11, id_unidad: 'WH104', fecha_ingreso: '2026-07-01', fecha_salida: null, dias_en_taller: null, diagnostico: 'Frenos traseros', criticidad: 'Media', costo_taller: 0, tipo_liberacion: null, pendientes: null, es_reincidencia: false },
    { id: 801, unidad_id: 13, id_unidad: 'WH125', fecha_ingreso: '2026-03-01', fecha_salida: '2026-05-26', dias_en_taller: 86, diagnostico: 'Transmisión tronada', criticidad: 'Crítico', costo_taller: 32000, tipo_liberacion: 'Total', pendientes: null, es_reincidencia: false },
  ]
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
  const cargasFake: Array<{ id: number; unidad_id: number; id_unidad: string; fecha: string; litros: number; costo_total: number; km_recorridos: number }> = [
    { id: 1, unidad_id: 10, id_unidad: 'WH101', fecha: '2026-06-20', litros: 392.16, costo_total: 10000, km_recorridos: 941 },
  ]
  // Parámetros del veredicto (RF-DASH-05) y evidencia por unidad para el
  // fake de /dashboard — espejo ligero del DashboardService real
  let umbralFake = 40
  let ventanaFake = 12
  const infoDash: Record<string, { ef: number | null; mejoralito: number }> = {
    WH101: { ef: 2.4, mejoralito: 0 },
    WH104: { ef: 2.1, mejoralito: 50 },
    WH118: { ef: 1.8, mejoralito: 50 },
    WH125: { ef: 1.2, mejoralito: 67 },
    WH210: { ef: 2.7, mejoralito: 0 },
  }
  const pesos = (n: number) => '$' + Math.round(n).toLocaleString('es-MX')
  return {
    ...real,
    getDashboard: async (seleccion?: string) => {
      const activos = unidadesFake.filter((u) => u.estado === 'Activo' && u.tipo === 'Tractor')
      const orden = activos.slice().sort((a, b) => b.costo_real_acumulado - a.costo_real_acumulado)
      const ranking = orden.map((u, i) => ({ id: u.id, id_unidad: u.id_unidad, costo_total: u.costo_real_acumulado, critico: i === 0 }))
      const el = activos.find((u) => u.id_unidad === seleccion) ?? orden[0]
      const extra = infoDash[el.id_unidad] ?? { ef: null, mejoralito: 0 }
      const valor = el.valor_referencia
      let veredicto: string | null
      let razon: string
      if (valor === null) {
        veredicto = null
        razon = 'Valor de referencia pendiente: captura el valor estimado de la unidad para calcular su veredicto.'
      } else {
        const pct = Math.round((el.costo_real_acumulado / valor) * 100)
        if (pct < umbralFake) {
          veredicto = 'Mantener'
          razon = `El costo acumulado (${pesos(el.costo_real_acumulado)}) representa el ${pct}% del valor estimado (${pesos(valor)}), debajo del umbral del ${umbralFake}%. La unidad sigue siendo un activo rentable.`
        } else if (extra.mejoralito > 0) {
          veredicto = 'Vender'
          razon = `El costo acumulado (${pesos(el.costo_real_acumulado)}) ya representa el ${pct}% del valor estimado del tracto (${pesos(valor)}), por encima del umbral del ${umbralFake}%. Además, ${extra.mejoralito}% de sus liberaciones fueron "mejoralito": reincide.`
        } else {
          veredicto = 'Evaluar'
          razon = `El costo acumulado (${pesos(el.costo_real_acumulado)}) ya representa el ${pct}% del valor estimado del tracto (${pesos(valor)}), por encima del umbral del ${umbralFake}%. Sin mejoralitos en la ventana: evaluar la unidad caso a caso.`
        }
      }
      return {
        kpis: { diesel: 124900, refacciones: 85000, taller: 60700, costo_real_acumulado: activos.reduce((a, u) => a + u.costo_real_acumulado, 0) },
        ranking,
        seleccion: {
          id: el.id,
          id_unidad: el.id_unidad,
          costo_total: el.costo_real_acumulado,
          valor_referencia: valor,
          eficiencia_km_l: extra.ef,
          pct_reparacion_total: 100 - extra.mejoralito,
          pct_mejoralito: extra.mejoralito,
          veredicto,
          razon,
          valor_referencia_pendiente: valor === null,
        },
        parametros: { umbral_pct: umbralFake, ventana_meses: ventanaFake },
      }
    },
    ajustarParametros: async (datos: { umbral_pct: number; ventana_meses: number }) => {
      umbralFake = datos.umbral_pct
      ventanaFake = datos.ventana_meses
      return { umbral_pct: umbralFake, ventana_meses: ventanaFake }
    },
    getDiesel: async () => cargasFake.slice(),
    registrarCarga: async (datos: { unidad_id: number; fecha: string; litros: number; costo_total: number; km_recorridos: number }) => {
      if (!(datos.litros > 0)) {
        throw new real.ApiError(422, 'validation', 'Datos de la carga inválidos.', {
          litros: ['El campo litros debe ser mayor a cero.'],
        })
      }
      const u = unidadesFake.find((x) => x.id === datos.unidad_id)
      if (!u) {
        throw new real.ApiError(422, 'validation', 'La unidad no existe en el catálogo.', {
          unidad_id: ['La unidad no existe en el catálogo.'],
        })
      }
      const nueva = { id: 100 + cargasFake.length, unidad_id: datos.unidad_id, id_unidad: u.id_unidad, fecha: datos.fecha, litros: datos.litros, costo_total: datos.costo_total, km_recorridos: datos.km_recorridos }
      cargasFake.unshift(nueva)
      return nueva
    },
    getFicha: async (id: number) => {
      const u = unidadesFake.find((x) => x.id === id)
      if (!u) throw new real.ApiError(404, 'not_found', 'Unidad no encontrada.')
      const base = {
        unidad: { id: u.id, id_unidad: u.id_unidad, tipo: u.tipo, estado: u.estado, valor_referencia: u.valor_referencia, candidata_reincidencia: u.candidata_reincidencia },
        kpis: { diesel: 0, refacciones: 0, taller: 0, costo_real_acumulado: u.costo_real_acumulado },
        reparaciones: [] as unknown[],
        piezas_instaladas: [] as unknown[],
        piezas_donadas: [] as unknown[],
      }
      if (u.id_unidad === 'WH125') {
        base.kpis = { diesel: 18000, refacciones: 43500, taller: 32000, costo_real_acumulado: 93500 }
        base.reparaciones = [
          { fecha_ingreso: '2026-03-01', fecha_salida: '2026-05-26', dias_en_taller: 86, diagnostico: 'Transmisión tronada', criticidad: 'Crítico', tipo_liberacion: 'Total', costo_taller: 32000, es_reincidencia: false },
          { fecha_ingreso: '2026-06-24', fecha_salida: '2026-06-27', dias_en_taller: 3, diagnostico: 'Ajuste de frenos', criticidad: 'Media', tipo_liberacion: 'Parcial', costo_taller: 2400, es_reincidencia: true },
        ]
        base.piezas_instaladas = [
          { descripcion_pieza: 'Caja de transmisión', origen: 'Yonke', unidad_donante_id: 'WH60', costo: 28000, es_estimado: true, estado: 'Instalado', fecha: '2026-05-20' },
        ]
      }
      if (u.id_unidad === 'WH03') {
        base.piezas_donadas = [
          { descripcion_pieza: 'Turbo', unidad_destino: 'WH101', costo_estimado: 4500, fecha: '2026-06-22' },
        ]
      }
      return base
    },
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
    crearRequisicion: async (datos: { origen: string; descripcion_pieza: string; costo_estimado_manual: number | null; unidad_destino_id: number; unidad_donante_id: number | null }) => {
      // Réplica ligera de la cascada A→C→manual del backend (ADR-002)
      const CATALOGO: Record<string, number> = { Alternador: 3200, Turbo: 4500 }
      let costo: number | null = null
      let origenCosto: string | null = null
      if (datos.origen === 'Yonke') {
        const enCatalogo = CATALOGO[datos.descripcion_pieza]
        if (enCatalogo) {
          costo = enCatalogo
          origenCosto = 'catalogo'
        } else if (datos.costo_estimado_manual && datos.costo_estimado_manual > 0) {
          costo = datos.costo_estimado_manual
          origenCosto = 'manual'
        } else {
          throw new real.ApiError(422, 'validation', 'Asigna un costo estimado a la pieza donada, aunque no exista factura.', {
            costo_estimado_manual: ['Asigna un costo estimado a la pieza donada, aunque no exista factura.'],
          })
        }
      }
      return {
        id: 999,
        estado: 'Solicitado',
        origen: datos.origen,
        unidad_destino_id: datos.unidad_destino_id,
        unidad_donante_id: datos.unidad_donante_id,
        descripcion_pieza: datos.descripcion_pieza,
        numero_parte: null,
        urgencia: 'Media',
        costo_estimado: costo,
        origen_costo_estimado: origenCosto,
        costo_real: null,
        foto_pieza_url: 'x.jpg',
        fecha_solicitud: '2026-07-07',
      }
    },
    getColaCompras: async (estado?: string) => {
      const peso: Record<string, number> = { 'Crítica': 0, Media: 1, 'Rápida': 2 }
      return reqsFake
        .filter((q) => !estado || q.estado === estado)
        .slice()
        .sort((a, b) => peso[a.urgencia] - peso[b.urgencia])
    },
    avanzarEstado: async (id: number, cambio: { estado: string; costo_real?: number; numero_factura?: string }) => {
      const q = reqsFake.find((x) => x.id === id)
      if (!q) throw new real.ApiError(404, 'not_found', 'Requisición no encontrada.')
      const legal = (q.origen === 'Compra' && q.estado === 'Solicitado' && cambio.estado === 'Cotizado')
        || (q.origen === 'Compra' && q.estado === 'Cotizado' && cambio.estado === 'Comprado')
        || (q.origen === 'Compra' && q.estado === 'Comprado' && cambio.estado === 'Instalado')
        || (q.origen === 'Yonke' && q.estado === 'Solicitado' && cambio.estado === 'Instalado')
      if (!legal) throw new real.ApiError(409, 'conflict', `Transición ilegal: ${q.origen} ${q.estado} → ${cambio.estado}.`)
      if (cambio.estado === 'Comprado' && (!cambio.costo_real || !cambio.numero_factura)) {
        throw new real.ApiError(422, 'validation', 'Falta el costo real y el número de factura.', {
          costo_real: ['Falta el costo real y el número de factura.'],
        })
      }
      Object.assign(q, { estado: cambio.estado, costo_real: cambio.costo_real ?? q.costo_real })
      return q
    },
    getTaller: async () => registrosFake.slice(),
    registrarIngreso: async (datos: { unidad_id: number; fecha_ingreso: string; diagnostico: string; criticidad: string }) => {
      const nuevo = {
        id: 900 + registrosFake.length,
        unidad_id: datos.unidad_id,
        id_unidad: unidadesFake.find((u) => u.id === datos.unidad_id)?.id_unidad ?? '—',
        fecha_ingreso: datos.fecha_ingreso,
        fecha_salida: null,
        dias_en_taller: null,
        diagnostico: datos.diagnostico,
        criticidad: datos.criticidad,
        costo_taller: 0,
        tipo_liberacion: null,
        pendientes: null,
        es_reincidencia: false,
      }
      registrosFake.unshift(nuevo)
      return nuevo
    },
    liberarUnidad: async (id: number, datos: { tipo_liberacion: string; fecha_salida: string; costo_taller: number; pendientes?: string[] }) => {
      const r = registrosFake.find((x) => x.id === id)
      if (!r) throw new real.ApiError(404, 'not_found', 'Registro de taller no encontrado.')
      if (r.tipo_liberacion !== null) throw new real.ApiError(409, 'conflict', 'La unidad ya fue liberada de este ingreso.')
      if (datos.tipo_liberacion === 'Parcial' && !(datos.pendientes ?? []).length) {
        throw new real.ApiError(422, 'validation', 'Una liberación parcial exige al menos un pendiente.', {
          pendientes: ['Una liberación parcial exige al menos un pendiente.'],
        })
      }
      Object.assign(r, { tipo_liberacion: datos.tipo_liberacion, fecha_salida: datos.fecha_salida, costo_taller: datos.costo_taller, pendientes: datos.pendientes ?? null, dias_en_taller: 1 })
      return r
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

test('Diésel aterriza en su pantalla y registra una carga (RF-DIE-01/02)', async () => {
  montarApp()
  await entrarComo('greisy@warhorse.mx')
  expect(await screen.findByRole('heading', { name: /control de diésel/i })).toBeInTheDocument()

  // Validación en cliente
  await userEvent.click(screen.getByRole('button', { name: /registrar carga/i }))
  expect(await screen.findByText('Selecciona la unidad que cargó diésel.')).toBeInTheDocument()

  await userEvent.selectOptions(
    screen.getByLabelText(/^unidad$/i),
    screen.getByRole('option', { name: 'WH101 · Tractor' }),
  )
  await userEvent.type(screen.getByLabelText(/fecha de la carga/i), '2026-07-08')
  await userEvent.type(screen.getByLabelText(/litros/i), '320.5')
  await userEvent.type(screen.getByLabelText(/costo total/i), '8975')
  await userEvent.type(screen.getByLabelText(/kilómetros recorridos/i), '410')
  await userEvent.click(screen.getByRole('button', { name: /registrar carga/i }))
  expect(await screen.findByText(/Carga registrada — el consolidado de WH101 ya la refleja/)).toBeInTheDocument()
  expect(await screen.findByText('320.5 L')).toBeInTheDocument()
})

test('diésel: el 422 numérico del backend se muestra verbatim', async () => {
  montarApp()
  await entrarComo('greisy@warhorse.mx')
  await screen.findByRole('heading', { name: /control de diésel/i })

  await userEvent.selectOptions(
    screen.getByLabelText(/^unidad$/i),
    screen.getByRole('option', { name: 'WH104 · Tractor' }),
  )
  await userEvent.type(screen.getByLabelText(/fecha de la carga/i), '2026-07-08')
  await userEvent.type(screen.getByLabelText(/litros/i), '0')
  await userEvent.type(screen.getByLabelText(/costo total/i), '100')
  await userEvent.type(screen.getByLabelText(/kilómetros recorridos/i), '10')
  await userEvent.click(screen.getByRole('button', { name: /registrar carga/i }))
  expect(await screen.findByText('El campo litros debe ser mayor a cero.')).toBeInTheDocument()
})

test('dashboard: ajustar umbral recalcula el veredicto server-side (RF-DASH-05)', async () => {
  montarApp()
  await entrarComo('direccion@warhorse.mx')
  await screen.findByText('Vender / dar de baja')
  expect(screen.getByText(/Umbral 40% · Ventana 12 meses/)).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: /ajustar parámetros/i }))
  const modal = await screen.findByRole('dialog', { name: /ajustar parámetros/i })
  const umbralInput = within(modal).getByLabelText(/umbral/i)
  await userEvent.clear(umbralInput)
  await userEvent.type(umbralInput, '50')
  await userEvent.click(within(modal).getByRole('button', { name: /guardar/i }))

  // WH125 (45%) queda debajo del nuevo umbral del 50% → Mantener
  expect(await screen.findByText('Mantener')).toBeInTheDocument()
  expect(screen.getByText(/Umbral 50% · Ventana 12 meses/)).toBeInTheDocument()
  expect(screen.getByText(/debajo del umbral del 50%/)).toBeInTheDocument()

  // De regreso a 40 el veredicto vuelve a Vender (recalcula en ambos sentidos)
  await userEvent.click(screen.getByRole('button', { name: /ajustar parámetros/i }))
  const modal2 = await screen.findByRole('dialog', { name: /ajustar parámetros/i })
  const umbralInput2 = within(modal2).getByLabelText(/umbral/i)
  await userEvent.clear(umbralInput2)
  await userEvent.type(umbralInput2, '40')
  await userEvent.click(within(modal2).getByRole('button', { name: /guardar/i }))
  expect(await screen.findByText('Vender / dar de baja')).toBeInTheDocument()
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

test('requisición: validaciones verbatim, cascada del backend y envío con foto real', async () => {
  montarApp()
  await entrarComo('edgar@warhorse.mx')
  await screen.findByRole('heading', { name: /requisición de refacciones/i })

  await userEvent.click(screen.getByRole('button', { name: /enviar requisición/i }))
  expect(await screen.findByText('Selecciona el tracto destino.')).toBeInTheDocument()

  await userEvent.selectOptions(
    screen.getByLabelText(/tracto destino/i),
    screen.getByRole('option', { name: 'WH125 · Tractor' }),
  )
  await userEvent.click(screen.getByRole('button', { name: /enviar requisición/i }))
  expect(await screen.findByText('Describe la pieza solicitada.')).toBeInTheDocument()

  await userEvent.type(screen.getByLabelText(/descripción de la pieza/i), 'Marcha reconstruida')
  await userEvent.click(screen.getByRole('button', { name: /canibalizado de yonke/i }))
  await userEvent.click(screen.getByRole('button', { name: /enviar requisición/i }))
  expect(await screen.findByText('El origen Yonke obliga a registrar la unidad donante.')).toBeInTheDocument()

  await userEvent.selectOptions(
    screen.getByLabelText(/tracto donante/i),
    screen.getByRole('option', { name: 'WH03 · Yonke donante' }),
  )
  await userEvent.click(screen.getByRole('button', { name: /enviar requisición/i }))
  expect(await screen.findByText('La foto de la pieza o número de serie es obligatoria.')).toBeInTheDocument()

  // Foto REAL (input file oculto tras la zona punteada)
  const archivo = new File(['foto'], 'pieza_dañada.jpg', { type: 'image/jpeg' })
  await userEvent.upload(screen.getByLabelText(/toca para adjuntar/i), archivo)
  expect(await screen.findByText(/pieza_dañada\.jpg adjunta/)).toBeInTheDocument()

  // A y C fallan para una pieza desconocida → el 422 de la cascada llega del backend
  await userEvent.click(screen.getByRole('button', { name: /enviar requisición/i }))
  expect(
    await screen.findByText('Asigna un costo estimado a la pieza donada, aunque no exista factura.'),
  ).toBeInTheDocument()

  await userEvent.type(screen.getByLabelText(/costo estimado/i), '2800')
  await userEvent.click(screen.getByRole('button', { name: /enviar requisición/i }))
  expect(await screen.findByText(/Requisición enviada — Compras la verá en su panel/)).toBeInTheDocument()
  expect(screen.getByText(/manual/)).toBeInTheDocument()
})

test('requisición Yonke de pieza en catálogo: el costo lo calcula el backend (cascada C)', async () => {
  montarApp()
  await entrarComo('edgar@warhorse.mx')
  await screen.findByRole('heading', { name: /requisición de refacciones/i })

  await userEvent.selectOptions(
    screen.getByLabelText(/tracto destino/i),
    screen.getByRole('option', { name: 'WH104 · Tractor' }),
  )
  await userEvent.type(screen.getByLabelText(/descripción de la pieza/i), 'Alternador')
  await userEvent.click(screen.getByRole('button', { name: /canibalizado de yonke/i }))
  await userEvent.selectOptions(
    screen.getByLabelText(/tracto donante/i),
    screen.getByRole('option', { name: 'WH60 · Yonke donante' }),
  )
  await userEvent.upload(
    screen.getByLabelText(/toca para adjuntar/i),
    new File(['foto'], 'alternador.jpg', { type: 'image/jpeg' }),
  )
  // SIN costo manual: la cascada lo resuelve por catálogo
  await userEvent.click(screen.getByRole('button', { name: /enviar requisición/i }))
  expect(await screen.findByText(/Costo estimado: \$3,200 \(catalogo\)/)).toBeInTheDocument()
})

test('compras: registrar compra exige costo real + factura; la instalación pide confirmación (RF-COM-02/03)', async () => {
  montarApp()
  await entrarComo('montzay@warhorse.mx')
  await screen.findByRole('heading', { name: /panel de compras/i })
  await screen.findByText('Balatas de freno')

  // Compra Cotizado → modal Registrar compra
  const filaBalatas = screen.getByText('Balatas de freno').closest('tr')!
  await userEvent.click(within(filaBalatas).getByRole('button', { name: /→ comprado/i }))
  const modalCompra = await screen.findByRole('dialog', { name: /registrar compra/i })

  // Sin datos → el 422 del backend aparece en el modal
  await userEvent.click(within(modalCompra).getByRole('button', { name: /^registrar$/i }))
  expect(await within(modalCompra).findByText('Falta el costo real y el número de factura.')).toBeInTheDocument()

  await userEvent.type(within(modalCompra).getByLabelText(/costo real/i), '1800')
  await userEvent.type(within(modalCompra).getByLabelText(/número de factura/i), 'F-777')
  await userEvent.click(within(modalCompra).getByRole('button', { name: /^registrar$/i }))
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

test('taller: ingreso y liberación parcial con pendientes (RF-TAL-01/03/04)', async () => {
  montarApp()
  await entrarComo('edgar@warhorse.mx')
  await screen.findByRole('heading', { name: /requisición de refacciones/i })
  await userEvent.click(screen.getByRole('button', { name: 'Taller' }))
  await screen.findByRole('heading', { name: /control de taller/i })
  await screen.findByText('Frenos traseros')

  // Ingreso con validación en cliente
  await userEvent.click(screen.getByRole('button', { name: /registrar ingreso/i }))
  expect(await screen.findByText('Selecciona la unidad que ingresa a taller.')).toBeInTheDocument()

  await userEvent.selectOptions(
    screen.getByLabelText(/^unidad$/i),
    screen.getByRole('option', { name: 'WH210 · Tractor' }),
  )
  await userEvent.type(screen.getByLabelText(/fecha de ingreso/i), '2026-07-07')
  await userEvent.type(screen.getByLabelText(/diagnóstico principal/i), 'Fuga de aire')
  await userEvent.click(screen.getByRole('button', { name: /registrar ingreso/i }))
  expect(await screen.findByText('Ingreso registrado — la unidad queda En Taller.')).toBeInTheDocument()

  // Liberación parcial: sin pendientes → error verbatim; con pendientes → alerta
  const filaFrenos = screen.getByText('Frenos traseros').closest('tr')!
  await userEvent.click(within(filaFrenos).getByRole('button', { name: /liberar/i }))
  const modal = await screen.findByRole('dialog', { name: /liberar wh104/i })
  await userEvent.click(within(modal).getByRole('button', { name: /parcial \(mejoralito\)/i }))
  await userEvent.type(within(modal).getByLabelText(/fecha de salida/i), '2026-07-08')
  await userEvent.click(within(modal).getByRole('button', { name: /^liberar$/i }))
  expect(await within(modal).findByText('Una liberación parcial exige al menos un pendiente.')).toBeInTheDocument()

  await userEvent.type(within(modal).getByLabelText(/pendientes/i), 'Manguera principal')
  await userEvent.click(within(modal).getByRole('button', { name: /^liberar$/i }))
  expect(
    await screen.findByText('WH104 liberada como mejoralito — se generó alerta de deuda técnica.'),
  ).toBeInTheDocument()

  // Pasa al historial como Mejoralito
  await waitFor(() => {
    const fila = screen.getByText('Frenos traseros').closest('tr')!
    expect(within(fila).getByText('Mejoralito')).toBeInTheDocument()
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
