// Tipos del dominio compartidos por las vistas — nomenclatura del demo
// validado; las entidades de datos viven en lib/api.ts (contrato doc 05).
export type Rol = 'admin' | 'taller' | 'compras' | 'diesel'
export type EstadoUnidad = 'Activo' | 'Yonke' | 'Inactivo' | 'Vendido'
export type TipoUnidad = 'Tractor' | 'Caja' | 'Thermo' | 'Servicio'
export type Origen = 'Compra' | 'Yonke'
export type Urgencia = 'Rápida' | 'Media' | 'Crítica'
export type EstadoRequisicion = 'Solicitado' | 'En aprobación' | 'En pago' | 'En recolección' | 'Más información' | 'Cancelado' | 'Rechazado' | 'Instalado' | 'Cotizado' | 'Comprado' | 'En trayecto'
