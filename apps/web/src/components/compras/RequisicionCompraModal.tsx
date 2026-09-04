import React from 'react'
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  Package 
} from 'lucide-react'
import { jsPDF } from 'jspdf'

export interface DetalleRequisicion {
  folio: string
  fecha: string
  solicitante: string
  tipo_destino: 'Unidad' | 'Stock' | 'Caja Chica'
  unidad_id?: string
  folio_ot?: string
  justificacion?: string
  items: Array<{
    pieza: string
    cantidad: number
    motivo?: string
  }>
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Procesada'
}

interface Props {
  requisicion: DetalleRequisicion | null
  abierto: boolean
  alCerrar: () => void
}

export const RequisicionCompraModal: React.FC<Props> = ({ requisicion, abierto, alCerrar }) => {
  if (!abierto || !requisicion) return null

  const descargarPdf = () => {
    const doc = new jsPDF()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('WARHORSE MÉXICO', 14, 20)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('FORMATO OFICIAL DE REQUISICIÓN DE COMPRA', 14, 26)
    doc.line(14, 30, 196, 30)

    doc.setFont('helvetica', 'bold')
    doc.text(`FOLIO REQ: ${requisicion.folio}`, 14, 38)
    doc.text(`FECHA: ${requisicion.fecha}`, 130, 38)
    doc.text(`SOLICITANTE: ${requisicion.solicitante}`, 14, 46)
    doc.text(`ESTADO: ${requisicion.estado.toUpperCase()}`, 130, 46)
    doc.text(`DESTINO: ${requisicion.tipo_destino.toUpperCase()}`, 14, 54)
    if (requisicion.unidad_id) {
      doc.text(`UNIDAD ASIGNADA: ${requisicion.unidad_id}`, 130, 54)
    }
    if (requisicion.folio_ot) {
      doc.text(`OT VINCULADA: ${requisicion.folio_ot}`, 14, 62)
    }

    doc.line(14, 68, 196, 68)
    doc.setFont('helvetica', 'bold')
    doc.text('PARTIDAS Y REFACCIONES SOLICITADAS:', 14, 76)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)

    let y = 84
    requisicion.items.forEach((item, idx) => {
      doc.text(`${idx + 1}. [Cant: ${item.cantidad} PZ] ${item.pieza}`, 14, y)
      if (item.motivo) {
        doc.text(`   Motivo: ${item.motivo}`, 14, y + 4)
        y += 10
      } else {
        y += 6
      }
    })

    if (requisicion.justificacion) {
      y += 6
      doc.setFont('helvetica', 'bold')
      doc.text('JUSTIFICACIÓN TÉCNICA / CAJA CHICA:', 14, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.text(requisicion.justificacion, 14, y, { maxWidth: 180 })
      y += 14
    }

    y += 15
    doc.line(14, y, 196, y)
    y += 12
    doc.setFont('helvetica', 'bold')
    doc.text('SOLICITADO POR: ___________________', 14, y)
    doc.text('AUTORIZADO POR: ___________________', 110, y)

    doc.save(`Requisicion_${requisicion.folio}.pdf`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C5A059] text-[#16191E]">
              <FileText className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-widest text-[#C5A059]">
                DOCUMENTO OFICIAL DE ADQUISICIÓN
              </span>
              <h3 className="font-['Barlow_Condensed'] text-xl font-extrabold uppercase tracking-wide text-white">
                Requisición: {requisicion.folio}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={descargarPdf}
              className="flex items-center gap-1.5 rounded-lg border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3 py-1.5 text-xs font-semibold text-[#f3f4f6] hover:border-[#C5A059] hover:text-[#C5A059] transition-all cursor-pointer"
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
              className="text-[#B8B2A6] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-5">
          {/* Metadatos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/60 p-4 text-xs">
            <div>
              <div className="text-[10px] text-[#B8B2A6]">Destino</div>
              <div className="font-['Barlow_Condensed'] text-base font-bold text-white mt-0.5">
                {requisicion.tipo_destino}
              </div>
              {requisicion.unidad_id && (
                <div className="text-[11px] text-[#F2620F] font-semibold">{requisicion.unidad_id}</div>
              )}
            </div>

            <div>
              <div className="text-[10px] text-[#B8B2A6]">OT Vinculada</div>
              <div className="font-['Barlow_Condensed'] text-base font-bold text-white mt-0.5">
                {requisicion.folio_ot || 'Sin OT (Stock)'}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-[#B8B2A6]">Solicitante</div>
              <div className="font-semibold text-white mt-0.5 truncate">
                {requisicion.solicitante}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-[#B8B2A6]">Fecha</div>
              <div className="font-semibold text-white mt-0.5">
                {requisicion.fecha}
              </div>
            </div>
          </div>

          {/* Partidas */}
          <div>
            <h4 className="mb-2 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider text-[#B8B2A6]">
              Partidas Requeridas ({requisicion.items.length})
            </h4>
            <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/40 p-3 space-y-2">
              {requisicion.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.04] last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-[#C5A059]" />
                    <div>
                      <span className="font-semibold text-white">{item.pieza}</span>
                      {item.motivo && (
                        <div className="text-[10px] text-[#B8B2A6]">{item.motivo}</div>
                      )}
                    </div>
                  </div>
                  <span className="font-['Barlow_Condensed'] font-bold text-[#F2620F] text-sm tabular-nums">
                    {item.cantidad} PZ
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Justificación si aplica */}
          {requisicion.justificacion && (
            <div>
              <h4 className="mb-1 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#B8B2A6]">
                Justificación Técnica
              </h4>
              <div className="rounded-xl border border-[rgba(243,239,231,0.06)] bg-[#1C1C1C]/30 p-3 text-xs text-[#f3f4f6]">
                {requisicion.justificacion}
              </div>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="border-t border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-6 py-3 text-right">
          <button
            type="button"
            onClick={alCerrar}
            className="rounded-xl bg-[#C5A059] px-5 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] hover:bg-[#a88744] transition-all cursor-pointer"
          >
            Cerrar Requisición
          </button>
        </div>
      </div>
    </div>
  )
}
