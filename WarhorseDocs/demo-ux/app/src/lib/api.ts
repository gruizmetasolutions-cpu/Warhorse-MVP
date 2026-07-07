// Contrato de datos del demo (Demo-First, ADR-003): las vistas importan SOLO
// este módulo; la implementación mock vive en lib/mock/ y se sustituye por la
// API real sin reescribir pantallas.
import type { DatosDemo } from './types'
import * as mock from './mock'

export const getDatos = (): Promise<DatosDemo> => mock.getDatos()
