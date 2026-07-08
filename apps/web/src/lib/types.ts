// Tipos del dominio compartidos por las vistas — nomenclatura del demo
// validado; las entidades de datos viven en lib/api.ts (contrato doc 05).
export type Rol = 'admin' | 'taller' | 'compras' | 'diesel'
export type EstadoUnidad = 'Activo' | 'Yonke' | 'Inactivo'
export type TipoUnidad = 'Tractor' | 'Caja' | 'Thermo'
export type Origen = 'Compra' | 'Yonke'
export type Urgencia = 'Rápida' | 'Media' | 'Crítica'
export type EstadoRequisicion = 'Solicitado' | 'Cotizado' | 'Comprado' | 'Instalado'

export interface UsuarioDemo {
  id: string
  nombre: string
  rol: Rol
  activo: boolean
}
