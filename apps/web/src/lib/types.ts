// Entidades del demo — espejo exacto de data/mockData.json del demo validado
// (Hub Gastos Tracto - Standalone.html).
export type Rol = 'admin' | 'taller' | 'compras' | 'diesel'
export type EstadoUnidad = 'Activo' | 'Yonke' | 'Inactivo'
export type TipoUnidad = 'Tractor' | 'Caja'
export type Origen = 'Compra' | 'Yonke'
export type Urgencia = 'Rápida' | 'Media' | 'Crítica'
export type Criticidad = 'Rápida' | 'Media' | 'Crítico'
export type EstadoRequisicion = 'Solicitado' | 'Cotizado' | 'Comprado' | 'Instalado'
export type TipoLiberacion = 'Total' | 'Mejoralito'

export interface Tracto {
  id: string
  tipo: TipoUnidad
  estado: EstadoUnidad
  valor_estimado: number
  gasto_diesel: number
  gasto_refacciones: number
  gasto_taller: number
  costo_total: number
  eficiencia_diesel_km: number
}

export interface Reparacion {
  id: string
  tracto_id: string
  fecha_ingreso: string
  fecha_salida: string
  dias_en_taller: number
  diagnostico: string
  criticidad: Criticidad
  tipo_liberacion: TipoLiberacion
  costo_estimado_taller: number
  mecanico: string
}

export interface Requisicion {
  id: string
  tracto_destino_id: string
  origen: Origen
  tracto_donante_id: string | null
  descripcion_pieza: string
  costo_estimado: number
  urgencia: Urgencia
  estado: EstadoRequisicion
  fecha_solicitud: string
  fecha_instalacion: string | null
}

export interface UsuarioDemo {
  id: string
  nombre: string
  rol: Rol
  activo: boolean
}

export interface DatosDemo {
  tractos: Tracto[]
  reparaciones: Reparacion[]
  requisiciones: Requisicion[]
}
