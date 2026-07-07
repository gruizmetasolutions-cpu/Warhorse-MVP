// Contrato de datos del SPA (doc 05). Auth es REAL desde el Sprint 1; el
// resto de los datos sigue en lib/mock/ y se sustituye sprint a sprint
// (Demo-First, ADR-003). Las vistas importan SOLO este módulo.
import type { DatosDemo, EstadoUnidad, Origen, Rol, TipoUnidad, Urgencia } from './types'
import * as mock from './mock'

const BASE = '/api/v1'

// El token de acceso vive en memoria del SPA (doc 04 §3.5), nunca en localStorage.
let tokenActual: string | null = null

export class ApiError extends Error {
  constructor(
    public status: number,
    public codigo: string,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    // Con FormData el navegador fija el boundary del multipart
    ...(opciones.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(opciones.headers as Record<string, string> | undefined),
  }
  if (tokenActual) headers.Authorization = `Bearer ${tokenActual}`

  const respuesta = await fetch(BASE + ruta, { ...opciones, headers })

  if (respuesta.status === 204) return undefined as T

  const cuerpo: unknown = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    const err = (cuerpo ?? {}) as { error?: string; message?: string; fields?: Record<string, string[]> }
    throw new ApiError(
      respuesta.status,
      err.error ?? 'server_error',
      err.message ?? 'Error del servidor.',
      err.fields,
    )
  }

  return cuerpo as T
}

export interface SesionLogin {
  token: string
  usuario: { id: number; nombre: string; rol: Rol }
  landing: string
}

export interface Yo {
  id: number
  nombre: string
  rol: Rol
  permisos: Record<string, boolean>
  landing: string
}

export async function login(email: string, password: string): Promise<SesionLogin> {
  const sesion = await pedir<SesionLogin>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  tokenActual = sesion.token
  return sesion
}

export async function logout(): Promise<void> {
  try {
    await pedir<void>('/auth/logout', { method: 'POST' })
  } finally {
    tokenActual = null
  }
}

export function me(): Promise<Yo> {
  return pedir<Yo>('/auth/me')
}

export function haySesion(): boolean {
  return tokenActual !== null
}

// ---- Catálogo de unidades (real desde el Sprint 2, doc 05 §3) ----

export interface UnidadApi {
  id: number
  id_unidad: string
  tipo: TipoUnidad
  estado: EstadoUnidad
  valor_referencia: number | null
  costo_real_acumulado: number
  candidata_reincidencia: boolean
}

export async function getUnidades(estado?: EstadoUnidad): Promise<UnidadApi[]> {
  const filtro = estado ? `&estado=${estado}` : ''
  const respuesta = await pedir<{ data: UnidadApi[] }>(`/unidades?per_page=100${filtro}`)
  return respuesta.data
}

export interface NuevaUnidad {
  id_unidad: string
  tipo: TipoUnidad
  estado: EstadoUnidad
  fecha_alta: string
  valor_referencia: number | null
}

export function crearUnidad(datos: NuevaUnidad): Promise<UnidadApi> {
  return pedir<UnidadApi>('/unidades', { method: 'POST', body: JSON.stringify(datos) })
}

export function actualizarUnidad(
  id: number,
  cambio: { estado?: EstadoUnidad; valor_referencia?: number },
): Promise<UnidadApi> {
  return pedir<UnidadApi>(`/unidades/${id}`, { method: 'PATCH', body: JSON.stringify(cambio) })
}

// ---- Requisiciones (reales desde el Sprint 3, doc 05 §5) ----

export interface RequisicionApi {
  id: number
  estado: string
  origen: Origen
  unidad_destino_id: number
  unidad_donante_id: number | null
  descripcion_pieza: string
  numero_parte: string | null
  urgencia: Urgencia
  costo_estimado: number | null
  origen_costo_estimado: 'ultima_compra' | 'catalogo' | 'manual' | null
  costo_real: number | null
  foto_pieza_url: string
  fecha_solicitud: string
}

export interface NuevaRequisicionApi {
  unidad_destino_id: number
  origen: Origen
  unidad_donante_id: number | null
  descripcion_pieza: string
  numero_parte: string | null
  urgencia: Urgencia
  costo_estimado_manual: number | null
  foto: File
}

export function crearRequisicion(datos: NuevaRequisicionApi): Promise<RequisicionApi> {
  const fd = new FormData()
  fd.set('unidad_destino_id', String(datos.unidad_destino_id))
  fd.set('origen', datos.origen)
  if (datos.unidad_donante_id !== null) fd.set('unidad_donante_id', String(datos.unidad_donante_id))
  fd.set('descripcion_pieza', datos.descripcion_pieza)
  if (datos.numero_parte) fd.set('numero_parte', datos.numero_parte)
  fd.set('urgencia', datos.urgencia)
  if (datos.costo_estimado_manual !== null) fd.set('costo_estimado_manual', String(datos.costo_estimado_manual))
  fd.set('foto_pieza', datos.foto)
  return pedir<RequisicionApi>('/requisiciones', { method: 'POST', body: fd })
}

// ---- Datos aún simulados (se sustituyen en los sprints 4-5) ----
export const getDatos = (): Promise<DatosDemo> => mock.getDatos()
