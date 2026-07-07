import {
  ApiError,
  type Dashboard,
  type EstadoRequisicion,
  type EstadoUnidad,
  type Ficha,
  type NuevaRequisicion,
  type Requisicion,
  type Rol,
  type Sesion,
  type Unidad,
  type Urgencia,
  type Usuario,
  type Veredicto,
} from '../types'
import * as fx from './fixtures'
import { getEscenario } from './scenarios'

// Estado mutable de la sesión demo (se pierde al recargar: nada persiste, ADR-003)
const unidades: Unidad[] = fx.unidades.map((u) => ({ ...u }))
const requisiciones: Requisicion[] = fx.requisiciones.map((r) => ({ ...r }))
const usuarios: Usuario[] = fx.usuarios.map((u) => ({ ...u }))
let parametros = { umbral_pct: 40, ventana_meses: 12 }
let sesionActual: Sesion | null = null
let siguienteId = 90

const delay = (ms = 400): Promise<void> =>
  new Promise((r) => setTimeout(r, import.meta.env.MODE === 'test' ? 0 : ms))

const errorDeRed = (): ApiError => new ApiError('server_error', 'No se pudieron cargar los datos.')

const dinero = (n: number): string => '$' + n.toLocaleString('en-US')

const buscarUnidad = (ref: number | string): Unidad | undefined =>
  unidades.find((u) => (typeof ref === 'number' ? u.id === ref : u.id_unidad === ref))

export async function login(email: string, _password: string): Promise<Sesion> {
  await delay()
  const usuario = usuarios.find((u) => u.email === email)
  if (!usuario || !usuario.activo) throw new ApiError('unauthenticated', 'Credenciales inválidas.')
  sesionActual = {
    token: 'demo-token-' + usuario.id,
    usuario,
    permisos: { ...fx.permisosPorRol[usuario.rol] },
    landing: fx.landingPorRol[usuario.rol],
  }
  return sesionActual
}

export async function logout(): Promise<void> {
  await delay(150)
  sesionActual = null
}

export async function me(): Promise<Sesion> {
  await delay(100)
  if (!sesionActual) throw new ApiError('unauthenticated', 'Sesión no iniciada.')
  return sesionActual
}

export async function getUnidades(estado?: EstadoUnidad): Promise<Unidad[]> {
  await delay()
  if (getEscenario() === 'error') throw errorDeRed()
  if (getEscenario() === 'vacio') return []
  return unidades.filter((u) => !estado || u.estado === estado)
}

export async function getFicha(idUnidad: string): Promise<Ficha> {
  await delay()
  if (getEscenario() === 'error') throw errorDeRed()
  const unidad = buscarUnidad(idUnidad)
  if (!unidad) throw new ApiError('not_found', 'Unidad no encontrada.')

  const instaladas = requisiciones.filter(
    (r) => r.unidad_destino_id === unidad.id && r.estado === 'Instalado',
  )
  const donadas = requisiciones
    .filter((r) => r.unidad_donante_id === unidad.id && r.estado === 'Instalado')
    .map((r) => ({
      descripcion_pieza: r.descripcion_pieza,
      unidad_destino: buscarUnidad(r.unidad_destino_id)?.id_unidad ?? '—',
      costo_estimado: r.costo_estimado ?? 0,
      fecha: r.fecha_solicitud,
    }))

  const esYonke = unidad.estado === 'Yonke'
  return {
    unidad,
    kpis: fx.kpisPorUnidad[unidad.id_unidad] ?? {
      diesel: 0, refacciones: 0, taller: 0, costo_real_acumulado: unidad.costo_real_acumulado,
    },
    reparaciones: esYonke ? [] : (fx.reparacionesPorUnidad[unidad.id_unidad] ?? []),
    piezas_instaladas: esYonke ? [] : instaladas,
    piezas_donadas: donadas,
  }
}

export async function crearRequisicion(n: NuevaRequisicion): Promise<Requisicion> {
  await delay()
  if (!n.unidad_destino_id) throw new ApiError('validation', 'Selecciona el tracto destino.')
  if (!n.descripcion_pieza.trim()) throw new ApiError('validation', 'Describe la pieza solicitada.')
  if (n.origen === 'Yonke') {
    if (!n.unidad_donante_id)
      throw new ApiError('validation', 'El origen Yonke obliga a registrar la unidad donante.')
    const donante = buscarUnidad(n.unidad_donante_id)
    if (!donante || donante.estado !== 'Yonke')
      throw new ApiError('conflict', 'La unidad donante no está en estado Yonke.')
    if (!n.costo_estimado_manual || n.costo_estimado_manual <= 0)
      throw new ApiError('validation', 'Asigna un costo estimado a la pieza donada, aunque no exista factura.')
  }
  if (!n.foto_adjunta)
    throw new ApiError('validation', 'La foto de la pieza o número de serie es obligatoria.')

  const esYonke = n.origen === 'Yonke'
  const req: Requisicion = {
    id: siguienteId++,
    estado: 'Solicitado',
    origen: n.origen,
    unidad_destino_id: n.unidad_destino_id,
    unidad_donante_id: esYonke ? n.unidad_donante_id : null,
    descripcion_pieza: n.descripcion_pieza.trim(),
    numero_parte: n.numero_parte?.trim() || null,
    urgencia: n.urgencia,
    costo_estimado: esYonke ? n.costo_estimado_manual : null,
    costo_real: null,
    es_estimado: esYonke,
    origen_costo_estimado: esYonke ? 'manual' : null,
    numero_factura: null,
    foto_pieza_url: '/uploads/demo-' + siguienteId + '.jpg',
    fecha_solicitud: new Date().toISOString().slice(0, 10),
  }
  requisiciones.push(req)
  return { ...req }
}

const ordenUrgencia: Record<Urgencia, number> = { Crítica: 0, Media: 1, Rápida: 2 }

export async function getColaCompras(estado?: EstadoRequisicion): Promise<Requisicion[]> {
  await delay()
  if (getEscenario() === 'error') throw errorDeRed()
  if (getEscenario() === 'vacio') return []
  return requisiciones
    .filter((r) => !estado || r.estado === estado)
    .sort((a, b) => ordenUrgencia[a.urgencia] - ordenUrgencia[b.urgencia])
    .map((r) => ({ ...r }))
}

export async function avanzarEstado(
  id: number,
  cambio: { estado: EstadoRequisicion; costo_real?: number; numero_factura?: string },
): Promise<Requisicion> {
  await delay()
  const r = requisiciones.find((x) => x.id === id)
  if (!r) throw new ApiError('not_found', 'Requisición no encontrada.')
  if (r.origen === 'Yonke' && cambio.numero_factura)
    throw new ApiError('conflict', 'Una requisición Yonke no puede llevar número de factura.')

  const transicionLegal =
    (cambio.estado === 'Cotizado' && r.origen === 'Compra' && r.estado === 'Solicitado') ||
    (cambio.estado === 'Comprado' && r.origen === 'Compra' && r.estado === 'Cotizado') ||
    (cambio.estado === 'Instalado' &&
      ((r.origen === 'Yonke' && r.estado === 'Solicitado') ||
        (r.origen === 'Compra' && r.estado === 'Comprado')))
  if (!transicionLegal) throw new ApiError('conflict', 'Transición de estado ilegal.')

  if (cambio.estado === 'Comprado') {
    if (!cambio.costo_real || !cambio.numero_factura)
      throw new ApiError('validation', 'Falta el costo real y el número de factura.')
    r.costo_real = cambio.costo_real
    r.numero_factura = cambio.numero_factura
    r.es_estimado = false
  }
  if (cambio.estado === 'Instalado') {
    // Consolidación: el costo (real o estimado) suma al tracto destino
    const destino = buscarUnidad(r.unidad_destino_id)
    const costo = r.origen === 'Yonke' ? (r.costo_estimado ?? 0) : (r.costo_real ?? 0)
    if (destino) destino.costo_real_acumulado += costo
  }
  r.estado = cambio.estado
  return { ...r }
}

export async function registrarDiesel(r: {
  unidad_id: number
  fecha: string
  litros: number
  costo_total: number
  km_recorridos: number
}): Promise<void> {
  await delay()
  if (!buscarUnidad(r.unidad_id)) throw new ApiError('validation', 'Unidad inexistente.')
}

export async function registrarIngreso(r: {
  unidad_id: number
  fecha_ingreso: string
  diagnostico: string
  criticidad: Urgencia
}): Promise<void> {
  await delay()
  if (!buscarUnidad(r.unidad_id)) throw new ApiError('validation', 'Unidad inexistente.')
}

export async function liberarUnidad(
  _id: number,
  r: { tipo_liberacion: 'Total' | 'Parcial'; fecha_salida: string; costo_taller: number; pendientes?: string[] },
): Promise<void> {
  await delay()
  if (r.tipo_liberacion === 'Parcial' && !r.pendientes?.length)
    throw new ApiError('validation', 'Una liberación parcial exige al menos un pendiente.')
}

function calcularVeredicto(unidad: Unidad): {
  veredicto: Veredicto | null
  razon: string
  valor_referencia_pendiente: boolean
} {
  if (unidad.valor_referencia === null) {
    return {
      veredicto: null,
      razon: 'Captura el valor de referencia de esta unidad para calcular su veredicto.',
      valor_referencia_pendiente: true,
    }
  }
  const analisis = fx.analisisPorUnidad[unidad.id_unidad]
  const pct = Math.round((unidad.costo_real_acumulado / unidad.valor_referencia) * 100)
  const montos = `El costo acumulado (${dinero(unidad.costo_real_acumulado)}) representa el ${pct}% del valor estimado (${dinero(unidad.valor_referencia)})`
  const mejoralito = analisis && analisis.pct_mejoralito > 0
    ? ` Además, ${analisis.pct_mejoralito}% de sus liberaciones fueron mejoralito: reincide.`
    : ''
  if (pct > parametros.umbral_pct) {
    return {
      veredicto: 'Vender',
      razon: `${montos}, por encima del umbral del ${parametros.umbral_pct}%.${mejoralito}`,
      valor_referencia_pendiente: false,
    }
  }
  if (pct > parametros.umbral_pct - 10) {
    return {
      veredicto: 'Evaluar',
      razon: `${montos}, cerca del umbral del ${parametros.umbral_pct}%. Vigilar su próximo ingreso a taller.${mejoralito}`,
      valor_referencia_pendiente: false,
    }
  }
  return {
    veredicto: 'Mantener',
    razon: `${montos}, por debajo del umbral del ${parametros.umbral_pct}%. La unidad sigue siendo rentable.`,
    valor_referencia_pendiente: false,
  }
}

export async function getDashboard(idUnidad?: string): Promise<Dashboard> {
  await delay()
  if (getEscenario() === 'error') throw errorDeRed()
  const activas = getEscenario() === 'vacio' ? [] : unidades.filter((u) => u.estado === 'Activo')
  const ordenadas = [...activas].sort((a, b) => b.costo_real_acumulado - a.costo_real_acumulado)
  const seleccionada = (idUnidad && ordenadas.find((u) => u.id_unidad === idUnidad)) || ordenadas[0]

  const analisisBase = seleccionada
    ? (fx.analisisPorUnidad[seleccionada.id_unidad] ?? {
        eficiencia_km_l: null, pct_reparacion_total: 100, pct_mejoralito: 0,
      })
    : { eficiencia_km_l: null, pct_reparacion_total: 0, pct_mejoralito: 0 }

  return {
    kpis: fx.kpisFlota,
    ranking: ordenadas.map((u, i) => ({
      id_unidad: u.id_unidad,
      costo_total: u.costo_real_acumulado,
      critico: i === 0,
    })),
    seleccion: seleccionada
      ? { id_unidad: seleccionada.id_unidad, ...analisisBase, ...calcularVeredicto(seleccionada) }
      : {
          id_unidad: '—', ...analisisBase, veredicto: null,
          razon: 'Sin datos suficientes', valor_referencia_pendiente: false,
        },
    parametros: { ...parametros },
  }
}

export async function setParametrosVeredicto(p: {
  umbral_pct: number
  ventana_meses: number
}): Promise<Dashboard> {
  await delay()
  if (p.umbral_pct < 20 || p.umbral_pct > 80)
    throw new ApiError('validation', 'El umbral debe estar entre 20 y 80.', { umbral_pct: ['between:20,80'] })
  if (p.ventana_meses < 1 || p.ventana_meses > 36)
    throw new ApiError('validation', 'La ventana debe estar entre 1 y 36 meses.', { ventana_meses: ['between:1,36'] })
  parametros = { ...p }
  return getDashboard()
}

export async function getUsuarios(): Promise<Usuario[]> {
  await delay()
  if (getEscenario() === 'error') throw errorDeRed()
  if (getEscenario() === 'vacio') return []
  return usuarios.map((u) => ({ ...u }))
}

export async function crearUsuario(n: { nombre: string; email: string; rol: Rol }): Promise<Usuario> {
  await delay()
  if (!n.nombre.trim() || !n.email.trim())
    throw new ApiError('validation', 'Nombre y correo son obligatorios.')
  if (usuarios.some((u) => u.email === n.email))
    throw new ApiError('conflict', 'Ya existe un usuario con ese correo.')
  const u: Usuario = {
    id: Math.max(...usuarios.map((x) => x.id)) + 1,
    nombre: n.nombre.trim(),
    email: n.email.trim(),
    rol: n.rol,
    activo: true,
  }
  usuarios.push(u)
  return { ...u }
}

export async function actualizarUsuario(
  id: number,
  cambio: { rol?: Rol; activo?: boolean },
): Promise<Usuario> {
  await delay()
  const u = usuarios.find((x) => x.id === id)
  if (!u) throw new ApiError('not_found', 'Usuario no encontrado.')
  if (cambio.rol !== undefined) u.rol = cambio.rol
  if (cambio.activo !== undefined) u.activo = cambio.activo
  return { ...u }
}
