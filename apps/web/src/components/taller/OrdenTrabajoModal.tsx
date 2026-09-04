import React from 'react'
import { 
  X, 
  Printer, 
  Download, 
  Wrench, 
  Truck, 
  User, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Package 
} from 'lucide-react'
import { jsPDF } from 'jspdf'

export interface DetalleOT {
  id: number
  folio: string
  tipo: 'Correctivo' | 'Preventivo' | 'Mantenimiento'
  estado: 'Activa' | 'En Proceso' | 'Liberada' | 'Liberada Parcial' | 'Cerrada'
  unidad_id: string
  unidad_nombre?: string
  tipo_unidad?: string
  responsable_nombre: string
  responsable_rol?: string
  diagnostico: string
  criticidad?: 'Rápida' | 'Media' | 'Crítico'
  fecha_ingreso: string
  fecha_salida?: string | null
  costo_taller?: number
  materiales?: Array<{ pieza: string; cantidad: number }>
  pendientes?: string[]
}

interface Props {
  ot: DetalleOT | null
  abierto: boolean
  alCerrar: () => void
}

export const OrdenTrabajoModal: React.FC<Props> = ({ ot, abierto, alCerrar }) => {
  if (!abierto || !ot) return null

  const esParcial = ot.estado === 'Liberada Parcial'
  const esLiberada = ot.estado === 'Liberada' || ot.estado === 'Cerrada'

  const estadoSaludUnidad = esLiberada
    ? 'Activo al 100%'
    : esParcial
    ? 'Activo con Warning'
    : 'Inactivo en Reparación'

  const colorSalud = esLiberada
    ? 'bg-[#3FA65C]/20 text-[#3FA65C] border-[#3FA65C]/40'
    : esParcial
    ? 'bg-[#E0C36A]/20 text-[#E0C36A] border-[#E0C36A]/40'
    : 'bg-[#B4430A]/20 text-[#F2620F] border-[#F2620F]/40'

  const descargarPdf = () => {
    const doc = new jsPDF()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('WARHORSE MÉXICO', 14, 20)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('ORDEN DE TRABAJO Y CONTROL DE TALLER MECÁNICO', 14, 26)
    doc.line(14, 30, 196, 30)

    doc.setFont('helvetica', 'bold')
    doc.text(`FOLIO DE OT: ${ot.folio}`, 14, 38)
    doc.text(`TIPO: OT ${ot.tipo.toUpperCase()}`, 120, 38)
    doc.text(`UNIDAD: ${ot.unidad_id}`, 14, 46)
    doc.text(`ESTADO DE OT: ${ot.estado.toUpperCase()}`, 120, 46)
    doc.text(`MECÁNICO: ${ot.responsable_nombre}`, 14, 54)
    doc.text(`FECHA INGRESO: ${ot.fecha_ingreso}`, 120, 54)
    doc.text(`ESTADO UNIDAD: ${estadoSaludUnidad.toUpperCase()}`, 14, 62)

    doc.line(14, 66, 196, 66)
    doc.setFont('helvetica', 'bold')
    doc.text('DIAGNÓSTICO TÉCNICO:', 14, 74)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(ot.diagnostico, 14, 82, { maxWidth: 180 })

    let y = 100
    if (ot.materiales && ot.materiales.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('MATERIALES Y REFACCIONES UTILIZADAS:', 14, y)
      y += 8
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      ot.materiales.forEach(m => {
        doc.text(`• [Cant: ${m.cantidad}] ${m.pieza}`, 14, y)
        y += 6
      })
    }

    if (ot.pendientes && ot.pendientes.length > 0) {
      y += 6
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('PENDIENTES REGISTRADOS (SALIDA CON WARNING):', 14, y)
      y += 8
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      ot.pendientes.forEach(p => {
        doc.text(`⚠️ ${p}`, 14, y)
        y += 6
      })
    }

    y += 12
    doc.line(14, y, 196, y)
    y += 12
    doc.setFont('helvetica', 'bold')
    doc.text(`FIRMA DEL JEFE DE TALLER: _____________________`, 14, y)
    doc.text(`COSTO DE MANO DE OBRA: $${(ot.costo_taller || 0).toLocaleString()} MXN`, 120, y)

    doc.save(`Orden_Trabajo_${ot.folio}.pdf`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del Documento */}
        <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2620F] text-[#16191E]">
              <Wrench className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-widest text-[#C5A059]">
                  ORDEN DE TRABAJO OFICIAL
                </span>
                <span
                  className={`rounded px-2 py-0.5 font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-wider ${
                    ot.tipo === 'Correctivo'
                      ? 'bg-[#F2620F]/20 text-[#F2620F]'
                      : 'bg-[#3FA65C]/20 text-[#3FA65C]'
                  }`}
                >
                  OT {ot.tipo}
                </span>
              </div>
              <h3 className="font-['Barlow_Condensed'] text-xl font-extrabold uppercase tracking-wide text-white">
                Folio: {ot.folio}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={descargarPdf}
              className="flex items-center gap-1.5 rounded-lg border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3 py-1.5 text-xs font-semibold text-[#f3f4f6] hover:border-[#F2620F] hover:text-[#F2620F] transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3 py-1.5 text-xs font-semibold text-[#f3f4f6] hover:border-white transition-all cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={alCerrar}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#B8B2A6] hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenido Oficial */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Banner de Sincronización con Salud de la Flota */}
          <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border p-4 ${colorSalud}`}>
            <div className="flex items-center gap-3">
              {esLiberada ? (
                <CheckCircle2 className="h-8 w-8 shrink-0" />
              ) : esParcial ? (
                <AlertTriangle className="h-8 w-8 shrink-0" />
              ) : (
                <Clock className="h-8 w-8 shrink-0 animate-pulse" />
              )}
              <div>
                <div className="text-[11px] uppercase font-['Barlow_Condensed'] font-semibold tracking-wider">
                  Estatus de la Unidad en Flota
                </div>
                <div className="font-['Barlow_Condensed'] text-2xl font-black uppercase tracking-wide">
                  {estadoSaludUnidad}
                </div>
              </div>
            </div>

            <div className="mt-3 sm:mt-0 text-left sm:text-right text-xs">
              <span className="rounded bg-black/40 px-2.5 py-1 font-['Barlow_Condensed'] font-bold uppercase tracking-wider">
                Estatus OT: {ot.estado}
              </span>
            </div>
          </div>

          {/* Cuadrícula de Datos de la OT */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#1C1C1C]/60 p-4">
            <div>
              <div className="flex items-center gap-1 text-[11px] text-[#B8B2A6]">
                <Truck className="h-3 w-3 text-[#F2620F]" />
                <span>Unidad</span>
              </div>
              <div className="font-['Barlow_Condensed'] text-lg font-bold text-white mt-0.5">
                {ot.unidad_id}
              </div>
              <div className="text-[10px] text-[#B8B2A6]">{ot.tipo_unidad || 'Tractor'}</div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-[11px] text-[#B8B2A6]">
                <User className="h-3 w-3 text-[#C5A059]" />
                <span>Mecánico Asignado</span>
              </div>
              <div className="font-['Barlow_Condensed'] text-base font-bold text-white mt-0.5 truncate">
                {ot.responsable_nombre}
              </div>
              <div className="text-[10px] text-[#B8B2A6]">{ot.responsable_rol || 'Mecánico A'}</div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-[11px] text-[#B8B2A6]">
                <Clock className="h-3 w-3 text-[#3FA65C]" />
                <span>Fecha Ingreso</span>
              </div>
              <div className="font-['Barlow_Condensed'] text-sm font-semibold text-white mt-0.5">
                {ot.fecha_ingreso}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-[11px] text-[#B8B2A6]">
                <FileText className="h-3 w-3 text-[#E0C36A]" />
                <span>Costo Mano Obra</span>
              </div>
              <div className="font-['Barlow_Condensed'] text-base font-bold tabular-nums text-white mt-0.5">
                ${(ot.costo_taller || 0).toLocaleString()} MXN
              </div>
            </div>
          </div>

          {/* Diagnóstico Técnico */}
          <div>
            <h4 className="mb-2 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider text-[#B8B2A6]">
              Diagnóstico Mecánico y Alcance
            </h4>
            <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/40 p-4 text-xs leading-relaxed text-[#f3f4f6]">
              {ot.diagnostico}
            </div>
          </div>

          {/* Refacciones / Materiales Requeridos */}
          {ot.materiales && ot.materiales.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider text-[#B8B2A6]">
                  Refacciones Vinculadas (Despacho / Requisición)
                </h4>
                <span className="text-[11px] text-[#3FA65C] font-semibold">
                  Habilita Requisición de Compras
                </span>
              </div>
              <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/40 p-3 space-y-2">
                {ot.materiales.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-white/[0.04] last:border-0">
                    <div className="flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 text-[#C5A059]" />
                      <span className="text-white font-medium">{m.pieza}</span>
                    </div>
                    <span className="font-['Barlow_Condensed'] font-bold text-[#F2620F] tabular-nums">
                      {m.cantidad} PZ
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pendientes de Liberación Parcial */}
          {ot.pendientes && ot.pendientes.length > 0 && (
            <div className="rounded-xl border border-[#E0C36A]/40 bg-[#E0C36A]/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#E0C36A]">
                <AlertTriangle className="h-4 w-4" />
                <h5 className="font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider">
                  Pendientes para Reanudación (Mismo Folio OT)
                </h5>
              </div>
              <p className="text-xs text-[#B8B2A6]">
                La unidad se liberó operativamente con Warning. Al regresar al taller, se reanuda bajo el mismo folio para consolidar costos.
              </p>
              <ul className="list-disc list-inside text-xs text-white space-y-1 mt-2">
                {ot.pendientes.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Pie del modal */}
        <div className="border-t border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-6 py-3 text-right">
          <button
            type="button"
            onClick={alCerrar}
            className="rounded-xl bg-[#F2620F] px-5 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] hover:bg-[#D9550C] transition-all cursor-pointer"
          >
            Cerrar Documento
          </button>
        </div>
      </div>
    </div>
  )
}
