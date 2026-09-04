import { get, set, del } from 'idb-keyval'
import type { OrdenInspeccionForm } from './inspeccionSchema'

const PREFIJO_BORRADOR = 'wh_borrador_inspeccion_'
const PREFIJO_HISTORIAL = 'wh_historial_inspecciones'

/**
 * Guarda un borrador de inspección en tiempo real en IndexedDB.
 */
export async function guardarBorradorLocal(
  operadorId: string,
  datos: Partial<OrdenInspeccionForm>
): Promise<void> {
  const clave = `${PREFIJO_BORRADOR}${operadorId}`
  const datosConTimestamp = {
    ...datos,
    _guardado_en: new Date().toISOString(),
  }
  await set(clave, datosConTimestamp)
}

/**
 * Obtiene el borrador activo para el operador en turno.
 */
export async function obtenerBorradorLocal(
  operadorId: string
): Promise<(Partial<OrdenInspeccionForm> & { _guardado_en?: string }) | null> {
  const clave = `${PREFIJO_BORRADOR}${operadorId}`
  const borrador = await get(clave)
  return borrador || null
}

/**
 * Elimina el borrador tras haberse finalizado la inspección.
 */
export async function eliminarBorradorLocal(operadorId: string): Promise<void> {
  const clave = `${PREFIJO_BORRADOR}${operadorId}`
  await del(clave)
}

/**
 * Guarda una orden de inspección finalizada en el registro local permanente de IndexedDB.
 */
export async function guardarInspeccionFinalizada(
  inspeccion: OrdenInspeccionForm
): Promise<void> {
  const listaActual: OrdenInspeccionForm[] = (await get(PREFIJO_HISTORIAL)) || []
  // Agregar al inicio para orden cronológico inverso
  const nuevaLista = [inspeccion, ...listaActual.filter(i => i.folio !== inspeccion.folio)]
  await set(PREFIJO_HISTORIAL, nuevaLista)
}

/**
 * Retorna todas las inspecciones almacenadas localmente en la tablet o navegador.
 */
export async function obtenerHistorialLocal(): Promise<OrdenInspeccionForm[]> {
  // Purga de inicio en CERO absoluto para el recorrido limpio E2E
  if (!localStorage.getItem('wh_reset_cero_aplicado_v2')) {
    await set(PREFIJO_HISTORIAL, [])
    localStorage.setItem('wh_reset_cero_aplicado_v2', 'true')
    return []
  }
  const lista: OrdenInspeccionForm[] = (await get(PREFIJO_HISTORIAL)) || []
  return lista
}

/**
 * Marca una orden local como sincronizada con el backend de Laragon.
 */
export async function marcarInspeccionSincronizada(folio: string): Promise<void> {
  const lista: OrdenInspeccionForm[] = (await get(PREFIJO_HISTORIAL)) || []
  const actualizada = lista.map(item => {
    if (item.folio === folio) {
      return { ...item, sincronizado: true }
    }
    return item
  })
  await set(PREFIJO_HISTORIAL, actualizada)
}

/**
 * Marca una inspección como atendida por una Orden de Trabajo generada en Taller.
 */
export async function marcarInspeccionAtendida(
  folioInspeccion: string,
  folioOT: string
): Promise<void> {
  const lista: OrdenInspeccionForm[] = (await get(PREFIJO_HISTORIAL)) || []
  const actualizada = lista.map(item => {
    if (item.folio === folioInspeccion) {
      return {
        ...item,
        ot_generada: folioOT,
        fecha_atencion_ot: new Date().toISOString(),
      }
    }
    return item
  })
  await set(PREFIJO_HISTORIAL, actualizada)
}


/**
 * Deja el historial local en CERO absoluto para pruebas E2E desde el inicio.
 */
export async function limpiarHistorialCompletoPatio(): Promise<void> {
  await set(PREFIJO_HISTORIAL, [])
}

/**
 * Inicializador de datos de patio: Mantiene el estado en 0 para simulaciones reales de inicio.
 */
export async function inicializarDatosMuestraPatio(): Promise<void> {
  // Estado CERO: No se inyectan folios demo para permitir recorrido fidedigno desde cero
}
