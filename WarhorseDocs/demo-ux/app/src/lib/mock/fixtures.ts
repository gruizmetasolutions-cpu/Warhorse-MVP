import type { Kpis, Reparacion, Requisicion, Rol, Unidad, Usuario } from '../types'

// Datos realistas del onboarding del taller (doc 09 §5.1)

export const usuarios: Usuario[] = [
  { id: 1, nombre: 'Dirección WarHorse', email: 'direccion@warhorse.mx', rol: 'admin', activo: true },
  { id: 2, nombre: 'Montzay Vázquez', email: 'montzay@warhorse.mx', rol: 'compras', activo: true },
  { id: 3, nombre: 'Edgar Fraga', email: 'edgar@warhorse.mx', rol: 'taller', activo: true },
  { id: 4, nombre: 'Kevin Rafael Ávila', email: 'kevin@warhorse.mx', rol: 'taller', activo: true },
  { id: 5, nombre: 'Greisy López', email: 'greisy@warhorse.mx', rol: 'diesel', activo: true },
  { id: 6, nombre: 'Héctor Ramírez', email: 'hector@warhorse.mx', rol: 'taller', activo: true },
]

export const unidades: Unidad[] = [
  { id: 10, id_unidad: 'WH101', tipo: 'Tractor', estado: 'Activo', valor_referencia: 580000, costo_real_acumulado: 210000, candidata_reincidencia: false },
  { id: 11, id_unidad: 'WH104', tipo: 'Tractor', estado: 'Activo', valor_referencia: 640000, costo_real_acumulado: 145200, candidata_reincidencia: false },
  { id: 12, id_unidad: 'WH125', tipo: 'Tractor', estado: 'Activo', valor_referencia: 620000, costo_real_acumulado: 312500, candidata_reincidencia: true },
  { id: 13, id_unidad: 'WH118', tipo: 'Tractor', estado: 'Activo', valor_referencia: 700000, costo_real_acumulado: 98400, candidata_reincidencia: false },
  { id: 3, id_unidad: 'WH03', tipo: 'Tractor', estado: 'Yonke', valor_referencia: null, costo_real_acumulado: 0, candidata_reincidencia: false },
  { id: 4, id_unidad: 'WH60', tipo: 'Tractor', estado: 'Yonke', valor_referencia: null, costo_real_acumulado: 0, candidata_reincidencia: false },
  { id: 5, id_unidad: 'WH88', tipo: 'Caja', estado: 'Inactivo', valor_referencia: 300000, costo_real_acumulado: 154000, candidata_reincidencia: false },
]

export const requisiciones: Requisicion[] = [
  {
    id: 86, estado: 'Solicitado', origen: 'Yonke', unidad_destino_id: 10, unidad_donante_id: 4,
    descripcion_pieza: 'Compresora de aire', numero_parte: null, urgencia: 'Crítica',
    costo_estimado: 3200, costo_real: null, es_estimado: true,
    origen_costo_estimado: 'catalogo', numero_factura: null,
    foto_pieza_url: '/uploads/compresora-wh60.jpg', fecha_solicitud: '2026-07-06',
  },
  {
    id: 87, estado: 'Instalado', origen: 'Yonke', unidad_destino_id: 12, unidad_donante_id: 3,
    descripcion_pieza: 'Turbo', numero_parte: null, urgencia: 'Crítica',
    costo_estimado: 4500, costo_real: null, es_estimado: true,
    origen_costo_estimado: 'ultima_compra', numero_factura: null,
    foto_pieza_url: '/uploads/turbo-wh03.jpg', fecha_solicitud: '2026-06-22',
  },
  {
    id: 88, estado: 'Cotizado', origen: 'Compra', unidad_destino_id: 11, unidad_donante_id: null,
    descripcion_pieza: 'Balatas delanteras', numero_parte: 'BAL-4420', urgencia: 'Media',
    costo_estimado: null, costo_real: null, es_estimado: false,
    origen_costo_estimado: null, numero_factura: null,
    foto_pieza_url: '/uploads/balatas-wh104.jpg', fecha_solicitud: '2026-07-01',
  },
  {
    id: 89, estado: 'Solicitado', origen: 'Compra', unidad_destino_id: 10, unidad_donante_id: null,
    descripcion_pieza: 'Filtro de aire', numero_parte: null, urgencia: 'Rápida',
    costo_estimado: null, costo_real: null, es_estimado: false,
    origen_costo_estimado: null, numero_factura: null,
    foto_pieza_url: '/uploads/filtro-wh101.jpg', fecha_solicitud: '2026-07-05',
  },
]

// Reparación insignia: WH125 — Transmisión, 86 días, Crítico, liberación Total.
export const reparacionesPorUnidad: Record<string, Reparacion[]> = {
  WH125: [
    { fecha_ingreso: '2026-03-01', fecha_salida: '2026-05-26', dias_en_taller: 86, diagnostico: 'Transmisión', criticidad: 'Crítica', tipo_liberacion: 'Total', costo_taller: 32000, es_reincidencia: false },
    { fecha_ingreso: '2026-06-10', fecha_salida: '2026-06-12', dias_en_taller: 2, diagnostico: 'Frenos', criticidad: 'Media', tipo_liberacion: 'Parcial', costo_taller: 8000, es_reincidencia: false },
  ],
  WH101: [
    { fecha_ingreso: '2026-05-14', fecha_salida: '2026-05-17', dias_en_taller: 3, diagnostico: 'Suspensión', criticidad: 'Media', tipo_liberacion: 'Total', costo_taller: 9500, es_reincidencia: false },
  ],
  WH104: [
    { fecha_ingreso: '2026-06-30', fecha_salida: null, dias_en_taller: 7, diagnostico: 'Frenos', criticidad: 'Media', tipo_liberacion: null, costo_taller: 0, es_reincidencia: false },
  ],
}

export const kpisPorUnidad: Record<string, Kpis> = {
  WH125: { diesel: 180000, refacciones: 92500, taller: 40000, costo_real_acumulado: 312500 },
  WH101: { diesel: 152000, refacciones: 38500, taller: 19500, costo_real_acumulado: 210000 },
  WH104: { diesel: 108200, refacciones: 25000, taller: 12000, costo_real_acumulado: 145200 },
  WH118: { diesel: 76400, refacciones: 14000, taller: 8000, costo_real_acumulado: 98400 },
  WH88: { diesel: 121000, refacciones: 21000, taller: 12000, costo_real_acumulado: 154000 },
}

export interface AnalisisBase {
  eficiencia_km_l: number | null
  pct_reparacion_total: number
  pct_mejoralito: number
}

export const analisisPorUnidad: Record<string, AnalisisBase> = {
  WH125: { eficiencia_km_l: 1.2, pct_reparacion_total: 80, pct_mejoralito: 20 },
  WH101: { eficiencia_km_l: 2.1, pct_reparacion_total: 100, pct_mejoralito: 0 },
  WH104: { eficiencia_km_l: 2.4, pct_reparacion_total: 100, pct_mejoralito: 0 },
  WH118: { eficiencia_km_l: 2.6, pct_reparacion_total: 100, pct_mejoralito: 0 },
}

export const kpisFlota: Kpis = { diesel: 1250000, refacciones: 480000, taller: 210000, costo_real_acumulado: 1940000 }

export const permisosPorRol: Record<Rol, { dashboard: boolean; requisicion: boolean; compras: boolean; catalogo: boolean; usuarios: boolean }> = {
  admin: { dashboard: true, requisicion: true, compras: true, catalogo: true, usuarios: true },
  taller: { dashboard: false, requisicion: true, compras: false, catalogo: true, usuarios: false },
  compras: { dashboard: false, requisicion: false, compras: true, catalogo: true, usuarios: false },
  diesel: { dashboard: false, requisicion: false, compras: false, catalogo: true, usuarios: false },
}

export const landingPorRol: Record<Rol, string> = {
  admin: 'dashboard',
  taller: 'requisicion',
  compras: 'compras',
  diesel: 'catalogo',
}
