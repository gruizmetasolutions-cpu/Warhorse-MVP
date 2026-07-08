// Contrato de datos del SPA (doc 05). Desde el Sprint 5 TODOS los datos son
// reales: auth (S1), unidades (S2), requisiciones (S3), compras/taller (S4)
// y diésel/dashboard/ficha (S5). Las vistas importan SOLO este módulo.
import type { EstadoRequisicion, EstadoUnidad, Origen, Rol, TipoUnidad, Urgencia } from './types'

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
  debe_cambiar_password: boolean
}

export interface Yo {
  id: number
  nombre: string
  rol: Rol
  permisos: Record<string, boolean>
  landing: string
  debe_cambiar_password: boolean
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

// Cambio de contraseña propio (alta sin correo): la persona define la suya
// tras entrar con la temporal. Devuelve la sesión sin la obligación pendiente.
export function cambiarPassword(datos: { password_actual: string; password_nueva: string }): Promise<{ debe_cambiar_password: boolean }> {
  return pedir<{ debe_cambiar_password: boolean }>('/auth/password', {
    method: 'PATCH',
    body: JSON.stringify(datos),
  })
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

// ---- Panel de Compras (real desde el Sprint 4, doc 05 §6) ----

export interface FilaCompras extends RequisicionApi {
  unidad_destino: string
  unidad_donante: string | null
}

export async function getColaCompras(estado?: EstadoRequisicion): Promise<FilaCompras[]> {
  const filtro = estado ? `?estado=${estado}` : ''
  const r = await pedir<{ data: FilaCompras[] }>(`/compras/requisiciones${filtro}`)
  return r.data
}

export function avanzarEstado(
  id: number,
  cambio: { estado: EstadoRequisicion; costo_real?: number; numero_factura?: string },
): Promise<RequisicionApi> {
  return pedir<RequisicionApi>(`/compras/requisiciones/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify(cambio),
  })
}

// ---- Taller (real desde el Sprint 4, doc 05 §7) ----

export interface RegistroTallerApi {
  id: number
  unidad_id: number
  id_unidad: string
  fecha_ingreso: string
  fecha_salida: string | null
  dias_en_taller: number | null
  diagnostico: string
  criticidad: 'Rápida' | 'Media' | 'Crítico'
  costo_taller: number
  tipo_liberacion: 'Total' | 'Parcial' | null
  pendientes: string[] | null
  es_reincidencia: boolean | 0 | 1
}

export async function getTaller(): Promise<RegistroTallerApi[]> {
  const r = await pedir<{ data: RegistroTallerApi[] }>('/taller')
  return r.data
}

export function registrarIngreso(datos: {
  unidad_id: number
  fecha_ingreso: string
  diagnostico: string
  criticidad: 'Rápida' | 'Media' | 'Crítico'
}): Promise<RegistroTallerApi> {
  return pedir<RegistroTallerApi>('/taller', { method: 'POST', body: JSON.stringify(datos) })
}

export function liberarUnidad(
  id: number,
  datos: { tipo_liberacion: 'Total' | 'Parcial'; fecha_salida: string; costo_taller: number; pendientes?: string[] },
): Promise<RegistroTallerApi> {
  return pedir<RegistroTallerApi>(`/taller/${id}/liberar`, { method: 'PATCH', body: JSON.stringify(datos) })
}

// ---- Diésel (real desde el Sprint 5, doc 05 §4) ----

export interface CargaDieselApi {
  id: number
  unidad_id: number
  id_unidad: string
  fecha: string
  litros: number
  costo_total: number
  km_recorridos: number
}

export async function getDiesel(filtros?: { unidad_id?: number; desde?: string; hasta?: string }): Promise<CargaDieselApi[]> {
  const query = new URLSearchParams({ per_page: '100' })
  if (filtros?.unidad_id) query.set('unidad_id', String(filtros.unidad_id))
  if (filtros?.desde) query.set('desde', filtros.desde)
  if (filtros?.hasta) query.set('hasta', filtros.hasta)
  const r = await pedir<{ data: CargaDieselApi[] }>(`/diesel?${query.toString()}`)
  return r.data
}

export function registrarCarga(datos: {
  unidad_id: number
  fecha: string
  litros: number
  costo_total: number
  km_recorridos: number
}): Promise<CargaDieselApi> {
  return pedir<CargaDieselApi>('/diesel', { method: 'POST', body: JSON.stringify(datos) })
}

// ---- Dashboard de Dirección (real desde el Sprint 5, doc 05 §8) ----

export type Veredicto = 'Mantener' | 'Evaluar' | 'Vender'

export interface SeleccionDashboard {
  id: number
  id_unidad: string
  costo_total: number
  valor_referencia: number | null
  eficiencia_km_l: number | null
  pct_reparacion_total: number
  pct_mejoralito: number
  veredicto: Veredicto | null
  razon: string
  valor_referencia_pendiente: boolean
}

export interface DashboardApi {
  kpis: { diesel: number; refacciones: number; taller: number; costo_real_acumulado: number }
  ranking: Array<{ id: number; id_unidad: string; costo_total: number; critico: boolean }>
  seleccion: SeleccionDashboard | null
  parametros: { umbral_pct: number; ventana_meses: number }
}

export function getDashboard(seleccion?: string): Promise<DashboardApi> {
  const filtro = seleccion ? `?seleccion=${encodeURIComponent(seleccion)}` : ''
  return pedir<DashboardApi>(`/dashboard${filtro}`)
}

export function ajustarParametros(datos: { umbral_pct: number; ventana_meses: number }): Promise<{ umbral_pct: number; ventana_meses: number }> {
  return pedir<{ umbral_pct: number; ventana_meses: number }>('/parametros/veredicto', {
    method: 'PATCH',
    body: JSON.stringify(datos),
  })
}

// ---- Salud de datos (real desde el Sprint 6, SRS §9) ----

export interface SaludDatosApi {
  requisiciones: { total: number; con_foto_y_origen: number; pct: number }
  liberaciones: { total: number; con_tipo: number; pct: number }
  yonke: {
    total: number
    con_costo: number
    pct: number
    por_origen: { ultima_compra: number; catalogo: number; manual: number }
  }
}

export function getSaludDatos(): Promise<SaludDatosApi> {
  return pedir<SaludDatosApi>('/metricas/salud')
}

// ---- Usuarios y permisos (real desde el Sprint 6, doc 05 §9) ----

export interface UsuarioAdminApi {
  id: number
  nombre: string
  email: string
  rol: Rol
  activo: boolean
}

// El alta devuelve la contraseña temporal UNA sola vez (sin correo).
export interface UsuarioCreado extends UsuarioAdminApi {
  password_temporal: string
}

export async function getUsuarios(): Promise<UsuarioAdminApi[]> {
  const r = await pedir<{ data: UsuarioAdminApi[] }>('/usuarios')
  return r.data
}

export function crearUsuario(datos: { nombre: string; email: string; rol: Rol }): Promise<UsuarioCreado> {
  return pedir<UsuarioCreado>('/usuarios', { method: 'POST', body: JSON.stringify(datos) })
}

export function actualizarUsuario(id: number, cambio: { rol?: Rol; activo?: boolean }): Promise<UsuarioAdminApi> {
  return pedir<UsuarioAdminApi>(`/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(cambio) })
}

// ---- Ficha de tracto (real desde el Sprint 5, doc 05 §3) ----

export interface FichaApi {
  unidad: {
    id: number
    id_unidad: string
    tipo: TipoUnidad
    estado: EstadoUnidad
    valor_referencia: number | null
    candidata_reincidencia: boolean
  }
  kpis: { diesel: number; refacciones: number; taller: number; costo_real_acumulado: number }
  reparaciones: Array<{
    fecha_ingreso: string
    fecha_salida: string | null
    dias_en_taller: number | null
    diagnostico: string
    criticidad: 'Rápida' | 'Media' | 'Crítico'
    tipo_liberacion: 'Total' | 'Parcial' | null
    costo_taller: number
    es_reincidencia: boolean
  }>
  piezas_instaladas: Array<{
    descripcion_pieza: string
    origen: Origen
    unidad_donante_id: string | null
    costo: number | null
    es_estimado: boolean
    estado: EstadoRequisicion
    fecha: string
  }>
  piezas_donadas: Array<{
    descripcion_pieza: string
    unidad_destino: string
    costo_estimado: number
    fecha: string
  }>
}

export function getFicha(id: number): Promise<FichaApi> {
  return pedir<FichaApi>(`/unidades/${id}/ficha`)
}
