import { z } from 'zod'

// Esquema para cada componente individual evaluado en el patio
export const itemInspeccionSchema = z
  .object({
    id: z.string(),
    sistema: z.string(),
    componente: z.string(),
    estado: z.enum(['Bueno', 'Regular', 'Crítico']),
    observacion: z.string().optional(),
    foto_url: z.string().optional(),
  })
  .refine(
    item => {
      // Regla innegociable de Zod: Si el estado NO es 'Bueno', la observación descriptiva es obligatoria
      if (item.estado !== 'Bueno') {
        return !!item.observacion && item.observacion.trim().length >= 4
      }
      return true
    },
    {
      message: 'Debe especificar el detalle de la falla u observación para este componente.',
      path: ['observacion'],
    }
  )

export type ItemInspeccion = z.infer<typeof itemInspeccionSchema>

// Lista maestra de sistemas y componentes estándar para la inspección física de transporte pesado
export const SISTEMAS_INSPECCION_DEFAULT = [
  { id: 'mot_aceite', sistema: 'Motor y Fluidos', componente: 'Nivel de Aceite de Motor' },
  { id: 'mot_anticongelante', sistema: 'Motor y Fluidos', componente: 'Nivel de Anticongelante / Fugas' },
  { id: 'mot_fugas', sistema: 'Motor y Fluidos', componente: 'Fugas de Aceite / Diésel Visibles' },
  { id: 'fre_balatas', sistema: 'Frenos y Neumáticos', componente: 'Presión y Estado de Neumáticos (Llantas)' },
  { id: 'fre_aire', sistema: 'Frenos y Neumáticos', componente: 'Líneas de Aire y Acoplamientos (Manitas)' },
  { id: 'fre_freno', sistema: 'Frenos y Neumáticos', componente: 'Respuesta de Freno de Servicio y Emergencia' },
  { id: 'luc_principales', sistema: 'Luces y Eléctrico', componente: 'Faros Delanteros (Altas y Bajas)' },
  { id: 'luc_stop', sistema: 'Luces y Eléctrico', componente: 'Luces de Freno (Stop) y Direccionales' },
  { id: 'luc_gibo', sistema: 'Luces y Eléctrico', componente: 'Luces de Galibo / Demarcadoras' },
  { id: 'cab_espejos', sistema: 'Carrocería y Cabina', componente: 'Espejos Retrovisores y Parabrisas' },
  { id: 'cab_limpiadores', sistema: 'Carrocería y Cabina', componente: 'Limpiaparabrisas y Claxon' },
  { id: 'cab_quinta', sistema: 'Carrocería y Cabina', componente: 'Quinta Rueda y Mecanismo de Traba' },
  { id: 'seg_extintor', sistema: 'Seguridad y Documentación', componente: 'Extintor Vigente y Triángulos de Emergencia' },
  { id: 'seg_documentos', sistema: 'Seguridad y Documentación', componente: 'Póliza de Seguro y Tarjeta de Circulación' },
]

// Esquema maestro de la Orden de Inspección de Patio
export const ordenInspeccionSchema = z.object({
  folio: z.string().min(3),
  fecha: z.string().min(8),
  operador_id: z.string().min(2, 'El número de empleado es requerido'),
  operador_nombre: z.string().min(3, 'El nombre del operador es requerido'),
  licencia: z.string().min(4, 'El número de licencia es requerido'),
  unidad_id: z.string().min(2, 'Debe seleccionar una unidad'),
  tipo_operacion: z.enum(['Cruce', 'Foráneo', 'Local', 'Backup']),
  kilometraje: z.number().min(0, 'El odómetro no puede ser negativo'),
  nivel_combustible: z.enum(['Reserva', '1/4', '1/2', '3/4', 'Lleno']),
  items: z.array(itemInspeccionSchema),
  observaciones_generales: z.string(),
  firma_digital: z.string().min(2, 'Debe confirmar su firma digital o nombre para validar'),
  requiere_ot: z.boolean(),
  sincronizado: z.boolean(),
  ot_generada: z.string().optional(),
  fecha_atencion_ot: z.string().optional(),
})

export type OrdenInspeccionForm = z.infer<typeof ordenInspeccionSchema>
