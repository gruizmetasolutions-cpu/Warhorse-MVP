export type Rol = 'admin' | 'taller' | 'compras' | 'diesel'
export type EstadoUnidad = 'Activo' | 'Yonke' | 'Inactivo'
export type TipoUnidad = 'Tractor' | 'Caja' | 'Thermo'
export type Origen = 'Compra' | 'Yonke'
export type Urgencia = 'Rápida' | 'Media' | 'Crítica'
export type EstadoRequisicion = 'Solicitado' | 'Cotizado' | 'Comprado' | 'Instalado'
export type OrigenCostoEstimado = 'ultima_compra' | 'catalogo' | 'manual'
export type Veredicto = 'Mantener' | 'Evaluar' | 'Vender'

export interface Usuario {
  id: number
  nombre: string
  email: string
  rol: Rol
  activo: boolean
}

export interface Permisos {
  dashboard: boolean
  requisicion: boolean
  compras: boolean
  catalogo: boolean
  usuarios: boolean
}

export interface Sesion {
  token: string
  usuario: Usuario
  permisos: Permisos
  landing: string
}

export interface Unidad {
  id: number
  id_unidad: string
  tipo: TipoUnidad
  estado: EstadoUnidad
  valor_referencia: number | null
  costo_real_acumulado: number
  candidata_reincidencia: boolean
}

export interface Requisicion {
  id: number
  estado: EstadoRequisicion
  origen: Origen
  unidad_destino_id: number
  unidad_donante_id: number | null
  descripcion_pieza: string
  numero_parte: string | null
  urgencia: Urgencia
  costo_estimado: number | null
  costo_real: number | null
  es_estimado: boolean
  origen_costo_estimado: OrigenCostoEstimado | null
  numero_factura: string | null
  foto_pieza_url: string
  fecha_solicitud: string
}

export interface Reparacion {
  fecha_ingreso: string
  fecha_salida: string | null
  dias_en_taller: number
  diagnostico: string
  criticidad: Urgencia
  tipo_liberacion: 'Total' | 'Parcial' | null
  costo_taller: number
  es_reincidencia: boolean
}

export interface PiezaDonada {
  descripcion_pieza: string
  unidad_destino: string
  costo_estimado: number
  fecha: string
}

export interface Kpis {
  diesel: number
  refacciones: number
  taller: number
  costo_real_acumulado: number
}

export interface Ficha {
  unidad: Unidad
  kpis: Kpis
  reparaciones: Reparacion[]
  piezas_instaladas: Requisicion[]
  piezas_donadas: PiezaDonada[]
}

export interface RankingItem {
  id_unidad: string
  costo_total: number
  critico: boolean
}

export interface AnalisisUnidad {
  id_unidad: string
  eficiencia_km_l: number | null
  pct_reparacion_total: number
  pct_mejoralito: number
  veredicto: Veredicto | null
  razon: string
  valor_referencia_pendiente: boolean
}

export interface Dashboard {
  kpis: Kpis
  ranking: RankingItem[]
  seleccion: AnalisisUnidad
  parametros: { umbral_pct: number; ventana_meses: number }
}

export interface NuevaRequisicion {
  unidad_destino_id: number | null
  origen: Origen
  unidad_donante_id: number | null
  descripcion_pieza: string
  numero_parte: string | null
  urgencia: Urgencia
  costo_estimado_manual: number | null
  foto_adjunta: boolean
}

export type CodigoError =
  | 'validation'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'server_error'

export class ApiError extends Error {
  constructor(
    public codigo: CodigoError,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
