import { setEscenario } from '../lib/mock/scenarios'
import * as api from '../lib/api'

const base = {
  unidad_destino_id: 12,
  origen: 'Compra' as const,
  unidad_donante_id: null,
  descripcion_pieza: 'Balatas',
  numero_parte: null,
  urgencia: 'Media' as const,
  costo_estimado_manual: null,
  foto_adjunta: true,
}

afterEach(() => setEscenario('normal'))

test('login por rol devuelve landing y permisos', async () => {
  const s = await api.login('direccion@warhorse.mx', 'x')
  expect(s.landing).toBe('dashboard')
  expect(s.permisos.usuarios).toBe(true)
  const t = await api.login('edgar@warhorse.mx', 'x')
  expect(t.landing).toBe('requisicion')
  expect(t.permisos.compras).toBe(false)
})

test('login con usuario inexistente falla con mensaje genérico', async () => {
  await expect(api.login('nadie@warhorse.mx', 'x')).rejects.toThrow('Credenciales inválidas.')
})

test('requisición sin foto rechazada con mensaje verbatim', async () => {
  await expect(api.crearRequisicion({ ...base, foto_adjunta: false }))
    .rejects.toThrow('La foto de la pieza o número de serie es obligatoria.')
})

test('requisición sin destino y sin descripción rechazadas', async () => {
  await expect(api.crearRequisicion({ ...base, unidad_destino_id: null }))
    .rejects.toThrow('Selecciona el tracto destino.')
  await expect(api.crearRequisicion({ ...base, descripcion_pieza: '' }))
    .rejects.toThrow('Describe la pieza solicitada.')
})

test('Yonke exige donante y costo > 0', async () => {
  await expect(api.crearRequisicion({ ...base, origen: 'Yonke' }))
    .rejects.toThrow('El origen Yonke obliga a registrar la unidad donante.')
  await expect(api.crearRequisicion({ ...base, origen: 'Yonke', unidad_donante_id: 3 }))
    .rejects.toThrow('Asigna un costo estimado a la pieza donada, aunque no exista factura.')
})

test('máquina de estados: Compra no salta a Instalado; Yonke sí', async () => {
  await expect(api.avanzarEstado(89, { estado: 'Instalado' }))
    .rejects.toThrow('Transición de estado ilegal.')
  const r = await api.crearRequisicion({
    ...base, origen: 'Yonke', unidad_donante_id: 3, costo_estimado_manual: 1200,
  })
  expect(r.estado).toBe('Solicitado')
  expect(r.origen_costo_estimado).toBe('manual')
  const inst = await api.avanzarEstado(r.id, { estado: 'Instalado' })
  expect(inst.estado).toBe('Instalado')
  expect(inst.es_estimado).toBe(true)
})

test('Compra exige costo_real y factura para pasar a Comprado', async () => {
  await expect(api.avanzarEstado(88, { estado: 'Comprado' }))
    .rejects.toThrow('Falta el costo real y el número de factura.')
  const ok = await api.avanzarEstado(88, { estado: 'Comprado', costo_real: 5200, numero_factura: 'F-10233' })
  expect(ok.estado).toBe('Comprado')
  expect(ok.es_estimado).toBe(false)
})

test('ficha WH125: reparación insignia y pieza Yonke estimada', async () => {
  const f = await api.getFicha('WH125')
  expect(f.kpis.costo_real_acumulado).toBe(312500)
  expect(f.reparaciones[0]).toMatchObject({ dias_en_taller: 86, diagnostico: 'Transmisión' })
  expect(f.piezas_instaladas[0]).toMatchObject({ origen: 'Yonke', es_estimado: true })
})

test('ficha Yonke muestra donaciones', async () => {
  const f = await api.getFicha('WH03')
  expect(f.reparaciones).toHaveLength(0)
  expect(f.piezas_donadas[0]).toMatchObject({ descripcion_pieza: 'Turbo', unidad_destino: 'WH125' })
})

test('escenario vacío y error', async () => {
  setEscenario('vacio')
  expect(await api.getUnidades()).toHaveLength(0)
  setEscenario('error')
  await expect(api.getUnidades()).rejects.toThrow('No se pudieron cargar los datos.')
})

test('cola de compras ordenada por urgencia', async () => {
  const cola = await api.getColaCompras()
  const urg = cola.map((r) => r.urgencia)
  expect(urg.indexOf('Crítica')).toBeLessThan(urg.lastIndexOf('Rápida'))
})

test('parámetros del veredicto recalculan y validan rango', async () => {
  await expect(api.setParametrosVeredicto({ umbral_pct: 90, ventana_meses: 12 }))
    .rejects.toThrow('El umbral debe estar entre 20 y 80.')
  const d = await api.setParametrosVeredicto({ umbral_pct: 40, ventana_meses: 12 })
  expect(d.seleccion.veredicto).toBe('Vender')
  const d2 = await api.setParametrosVeredicto({ umbral_pct: 55, ventana_meses: 12 })
  expect(d2.seleccion.veredicto).toBe('Evaluar')
})
