import React from 'react'
import { 
  X, 
  Printer, 
  Download, 
  ShoppingCart 
} from 'lucide-react'
import { jsPDF } from 'jspdf'

export interface DetalleOrdenCompra {
  id?: number
  folio: string
  fecha: string
  proveedor: string
  rfc?: string
  condicion_pago: 'Contado' | 'Crédito 15 días' | 'Crédito 30 días'
  moneda: 'MXN' | 'USD'
  tipo_cambio?: number
  unidad_id?: string
  folio_ot?: string
  categoria: string
  es_caja_chica?: boolean
  partidas: Array<{
    pieza: string
    cantidad: number
    precio_unitario: number
  }>
  subtotal: number
  iva: number
  total: number
  solicitado_por: string
  autorizado_por?: string
  estado: 'Pendiente' | 'Aprobada' | 'Pagada'
}

interface Props {
  oc: DetalleOrdenCompra | null
  abierto: boolean
  alCerrar: () => void
}

export const OrdenCompraModal: React.FC<Props> = ({ oc, abierto, alCerrar }) => {
  if (!abierto || !oc) return null

  const fmtMoneda = (val: number | undefined | null) => {
    const n = typeof val === 'number' ? val : Number(val)
    return isNaN(n) ? '0.00' : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const descargarPdf = () => {
    const doc = new jsPDF()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('WARHORSE MÉXICO', 14, 20)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('ORDEN DE COMPRA OFICIAL (OC)', 14, 26)
    doc.line(14, 30, 196, 30)

    doc.setFont('helvetica', 'bold')
    doc.text(`FOLIO OC: ${oc.folio}`, 14, 38)
    doc.text(`FECHA: ${oc.fecha}`, 130, 38)
    doc.text(`PROVEEDOR: ${oc.proveedor}`, 14, 46)
    doc.text(`CONDICIÓN: ${oc.condicion_pago}`, 130, 46)
    doc.text(`DESTINO: ${oc.unidad_id ? `Unidad ${oc.unidad_id}` : 'Almacén General'}`, 14, 54)
    doc.text(`OT VINCULADA: ${oc.folio_ot || (oc.es_caja_chica ? 'Caja Chica' : 'N/A')}`, 130, 54)

    doc.line(14, 60, 196, 60)
    doc.setFont('helvetica', 'bold')
    doc.text('CANT', 14, 68)
    doc.text('DESCRIPCIÓN DE LA REFACCIÓN', 34, 68)
    doc.text('P. UNITARIO', 130, 68)
    doc.text('TOTAL', 170, 68)
    doc.line(14, 71, 196, 71)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    let y = 78
    oc.partidas.forEach(p => {
      const imp = Number(p.cantidad || 1) * Number(p.precio_unitario || 0)
      doc.text(`${p.cantidad}`, 14, y)
      doc.text(p.pieza, 34, y)
      doc.text(`$${fmtMoneda(p.precio_unitario)} ${oc.moneda}`, 130, y)
      doc.text(`$${fmtMoneda(imp)} ${oc.moneda}`, 170, y)
      y += 7
    })

    y += 5
    doc.line(14, y, 196, y)
    y += 8
    doc.setFont('helvetica', 'bold')
    doc.text(`SUBTOTAL:`, 130, y)
    doc.text(`$${fmtMoneda(oc.subtotal)} ${oc.moneda}`, 170, y)
    y += 6
    doc.text(`IVA (16%):`, 130, y)
    doc.text(`$${fmtMoneda(oc.iva)} ${oc.moneda}`, 170, y)
    y += 6
    doc.text(`TOTAL GENERAL:`, 130, y)
    doc.text(`$${fmtMoneda(oc.total)} ${oc.moneda}`, 170, y)

    y += 18
    doc.line(14, y, 196, y)
    y += 10
    doc.text('SOLICITANTE: ___________________', 14, y)
    doc.text('DIRECTOR DE COMPRAS: ___________________', 110, y)

    doc.save(`Orden_Compra_${oc.folio}.pdf`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2620F] text-[#16191E]">
              <ShoppingCart className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-widest text-[#C5A059]">
                  ORDEN DE COMPRA OFICIAL
                </span>
                {oc.es_caja_chica && (
                  <span className="rounded bg-[#E0C36A]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-[10px] font-bold uppercase text-[#E0C36A]">
                    Caja Chica
                  </span>
                )}
              </div>
              <h3 className="font-['Barlow_Condensed'] text-xl font-extrabold uppercase tracking-wide text-white">
                Folio: {oc.folio}
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
              <div className="text-[10px] text-[#B8B2A6]">Proveedor</div>
              <div className="font-bold text-white mt-0.5 truncate">
                {oc.proveedor}
              </div>
              <div className="text-[10px] text-[#C5A059]">{oc.condicion_pago}</div>
            </div>

            <div>
              <div className="text-[10px] text-[#B8B2A6]">Destino</div>
              <div className="font-['Barlow_Condensed'] text-sm font-bold text-white mt-0.5">
                {oc.unidad_id ? `Unidad ${oc.unidad_id}` : 'Almacén General'}
              </div>
              <div className="text-[10px] text-[#B8B2A6]">{oc.categoria}</div>
            </div>

            <div>
              <div className="text-[10px] text-[#B8B2A6]">OT Vinculada</div>
              <div className="font-['Barlow_Condensed'] text-sm font-bold text-[#F2620F] mt-0.5">
                {oc.folio_ot || (oc.es_caja_chica ? 'Caja Chica' : 'Sin OT')}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-[#B8B2A6]">Fecha Emisión</div>
              <div className="font-semibold text-white mt-0.5">
                {oc.fecha}
              </div>
            </div>
          </div>

          {/* Tabla de Partidas */}
          <div className="overflow-x-auto rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/40">
            <table className="w-full text-left text-xs text-[#f3f4f6]">
              <thead className="border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] font-['Barlow_Condensed'] uppercase tracking-wider text-[#B8B2A6]">
                <tr>
                  <th className="px-4 py-2.5">Cant</th>
                  <th className="px-4 py-2.5">Descripción de la Refacción</th>
                  <th className="px-4 py-2.5 text-right">P. Unitario</th>
                  <th className="px-4 py-2.5 text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(243,239,231,0.06)] font-['Barlow']">
                {oc.partidas.map((p, idx) => {
                  const cant = Number(p.cantidad || 1)
                  const pu = Number(p.precio_unitario || 0)
                  const importe = cant * pu
                  return (
                    <tr key={idx}>
                      <td className="px-4 py-2.5 font-['Barlow_Condensed'] font-bold text-white tabular-nums">
                        {cant} PZ
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-white">
                        {p.pieza}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-[#B8B2A6]">
                        ${fmtMoneda(pu)} {oc.moneda}
                      </td>
                      <td className="px-4 py-2.5 text-right font-['Barlow_Condensed'] font-bold tabular-nums text-[#F2620F]">
                        ${fmtMoneda(importe)} {oc.moneda}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="flex justify-end">
            <div className="w-64 rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/60 p-3 space-y-1.5 text-xs font-['Barlow_Condensed']">
              <div className="flex justify-between text-[#B8B2A6]">
                <span>Subtotal:</span>
                <span className="font-bold tabular-nums text-white">
                  ${fmtMoneda(oc.subtotal)} {oc.moneda}
                </span>
              </div>
              <div className="flex justify-between text-[#B8B2A6]">
                <span>IVA (16%):</span>
                <span className="font-bold tabular-nums text-white">
                  ${fmtMoneda(oc.iva)} {oc.moneda}
                </span>
              </div>
              <div className="flex justify-between border-t border-[rgba(243,239,231,0.1)] pt-1.5 text-sm text-white">
                <span className="font-bold uppercase tracking-wider text-[#F2620F]">
                  Total General:
                </span>
                <span className="font-black tabular-nums text-[#F2620F]">
                  ${fmtMoneda(oc.total)} {oc.moneda}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pie */}
        <div className="border-t border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-6 py-3 text-right">
          <button
            type="button"
            onClick={alCerrar}
            className="rounded-xl bg-[#F2620F] px-5 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] hover:bg-[#D9550C] transition-all cursor-pointer"
          >
            Cerrar Orden de Compra
          </button>
        </div>
      </div>
    </div>
  )
}
