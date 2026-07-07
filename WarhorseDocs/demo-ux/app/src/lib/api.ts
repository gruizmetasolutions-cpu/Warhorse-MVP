// Contrato de cliente (doc 05 — firma congelada por el demo validado).
// Los componentes importan SOLO este módulo. En producción, la implementación
// mock se sustituye por llamadas reales sin reescribir pantallas (ADR-003).
import type {
  Dashboard,
  EstadoRequisicion,
  EstadoUnidad,
  Ficha,
  NuevaRequisicion,
  Requisicion,
  Rol,
  Sesion,
  Unidad,
  Urgencia,
  Usuario,
} from './types'
import * as mock from './mock'

export const login = (email: string, password: string): Promise<Sesion> =>
  mock.login(email, password)

export const logout = (): Promise<void> => mock.logout()

export const me = (): Promise<Sesion> => mock.me()

export const getUnidades = (estado?: EstadoUnidad): Promise<Unidad[]> =>
  mock.getUnidades(estado)

export const getFicha = (idUnidad: string): Promise<Ficha> => mock.getFicha(idUnidad)

export const crearRequisicion = (r: NuevaRequisicion): Promise<Requisicion> =>
  mock.crearRequisicion(r)

export const getColaCompras = (estado?: EstadoRequisicion): Promise<Requisicion[]> =>
  mock.getColaCompras(estado)

export const avanzarEstado = (
  id: number,
  cambio: { estado: EstadoRequisicion; costo_real?: number; numero_factura?: string },
): Promise<Requisicion> => mock.avanzarEstado(id, cambio)

export const registrarDiesel = (r: {
  unidad_id: number
  fecha: string
  litros: number
  costo_total: number
  km_recorridos: number
}): Promise<void> => mock.registrarDiesel(r)

export const registrarIngreso = (r: {
  unidad_id: number
  fecha_ingreso: string
  diagnostico: string
  criticidad: Urgencia
}): Promise<void> => mock.registrarIngreso(r)

export const liberarUnidad = (
  id: number,
  r: { tipo_liberacion: 'Total' | 'Parcial'; fecha_salida: string; costo_taller: number; pendientes?: string[] },
): Promise<void> => mock.liberarUnidad(id, r)

export const getDashboard = (idUnidad?: string): Promise<Dashboard> =>
  mock.getDashboard(idUnidad)

export const setParametrosVeredicto = (p: {
  umbral_pct: number
  ventana_meses: number
}): Promise<Dashboard> => mock.setParametrosVeredicto(p)

export const getUsuarios = (): Promise<Usuario[]> => mock.getUsuarios()

export const crearUsuario = (u: { nombre: string; email: string; rol: Rol }): Promise<Usuario> =>
  mock.crearUsuario(u)

export const actualizarUsuario = (
  id: number,
  cambio: { rol?: Rol; activo?: boolean },
): Promise<Usuario> => mock.actualizarUsuario(id, cambio)
