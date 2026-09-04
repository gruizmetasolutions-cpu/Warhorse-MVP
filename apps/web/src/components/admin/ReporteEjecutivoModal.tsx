import React from 'react'
import { 
  X, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Recycle, 
  Archive 
} from 'lucide-react'
import { jsPDF } from 'jspdf'

export interface DetalleReporteUnidad {
  id_unidad: string
  tipo: string
  estado_salud: 'Activo al 100%' | 'Activo con Warning' | 'Inactivo en Reparación' | 'Inactivo en Yonke' | 'Baja Definitiva'
  costo_acumulado: number
  valor_referencia: number
  porcentaje_consumido: number
  candidata_yonke: boolean
}

export interface DetalleReporteEjecutivo {
  folio: string
  fecha: string
  autor: string
  total_unidades: number
  tasa_disponibilidad: number
  costo_total_acumulado: number
  valor_total_flota: number
  distribucion_salud: {
    activo_100: number
    warning: number
    reparacion: number
    yonke: number
    baja: number
  }
  unidades: DetalleReporteUnidad[]
}

interface Props {
  reporte: DetalleReporteEjecutivo | null
  abierto: boolean
  alCerrar: () => void
}

export const ReporteEjecutivoModal: React.FC<Props> = ({ reporte, abierto, alCerrar }) => {
  if (!abierto || !reporte) return null

  const descargarPdf = () => {
    const doc = new jsPDF()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('WARHORSE MÉXICO', 14, 20)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('REPORTE EJECUTIVO DE SALUD DE FLOTA Y COSTO TOTAL (TCO)', 14, 26)
    doc.line(14, 30, 196, 30)

    doc.setFont('helvetica', 'bold')
    doc.text(`FOLIO DE REPORTE: ${reporte.folio}`, 14, 38)
    doc.text(`FECHA: ${reporte.fecha}`, 130, 38)
    doc.text(`AUTOR: ${reporte.autor}`, 14, 46)
    doc.text(`DISPONIBILIDAD: ${reporte.tasa_disponibilidad}%`, 130, 46)
    doc.text(`INVERSIÓN TOTAL: $${reporte.costo_total_acumulado.toLocaleString()} MXN`, 14, 54)
    doc.text(`VALOR DE FLOTA: $${reporte.valor_total_flota.toLocaleString()} MXN`, 130, 54)

    doc.line(14, 60, 196, 60)
    doc.setFont('helvetica', 'bold')
    doc.text('DISTRIBUCIÓN DE SALUD DE FLOTA (5 ESTADOS):', 14, 68)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(
      `• Activo 100%: ${reporte.distribucion_salud.activo_100}  |  • Warning: ${reporte.distribucion_salud.warning}  |  • Taller: ${reporte.distribucion_salud.reparacion}  |  • Yonke: ${reporte.distribucion_salud.yonke}  |  • Baja: ${reporte.distribucion_salud.baja}`,
      14,
      76
    )

    doc.line(14, 82, 196, 82)
    doc.setFont('helvetica', 'bold')
    doc.text('TRACTO', 14, 90)
    doc.text('TIPO', 40, 90)
    doc.text('SALUD', 70, 90)
    doc.text('COSTO ACUM', 115, 90)
    doc.text('VALOR REF', 150, 90)
    doc.text('% TCO', 182, 90)
    doc.line(14, 93, 196, 93)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    let y = 100
    reporte.unidades.forEach(u => {
      doc.text(u.id_unidad, 14, y)
      doc.text(u.tipo, 40, y)
      doc.text(u.estado_salud.substring(0, 18), 70, y)
      doc.text(`$${u.costo_acumulado.toLocaleString()}`, 115, y)
      doc.text(`$${u.valor_referencia.toLocaleString()}`, 150, y)
      doc.text(`${u.porcentaje_consumido}% ${u.candidata_yonke ? '⚠️' : ''}`, 182, y)
      y += 6
    })

    y += 15
    doc.line(14, y, 196, y)
    y += 10
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('FIRMA DIRECCIÓN OPERATIVA: ___________________', 14, y)
    doc.text('DIRECCIÓN DE FINANZAS: ___________________', 115, y)

    doc.save(`Reporte_Ejecutivo_${reporte.folio}.pdf`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2620F] text-[#16191E]">
              <FileSpreadsheet className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-widest text-[#C5A059]">
                INFORME DIRECTIVO OFICIAL
              </span>
              <h3 className="font-['Barlow_Condensed'] text-xl font-extrabold uppercase tracking-wide text-white">
                Reporte Ejecutivo: {reporte.folio}
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
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Métricas Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/60 p-4 text-xs font-['Barlow_Condensed']">
            <div>
              <div className="text-[10px] uppercase text-[#B8B2A6]">Disponibilidad</div>
              <div className="text-2xl font-black text-[#3FA65C] mt-0.5 tabular-nums">
                {reporte.tasa_disponibilidad}%
              </div>
              <div className="text-[10px] text-[#B8B2A6]">Flota en operación</div>
            </div>

            <div>
              <div className="text-[10px] uppercase text-[#B8B2A6]">Inversión Acumulada</div>
              <div className="text-2xl font-black text-[#F2620F] mt-0.5 tabular-nums">
                ${reporte.costo_total_acumulado.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#B8B2A6]">Mantenimiento + Compras</div>
            </div>

            <div>
              <div className="text-[10px] uppercase text-[#B8B2A6]">Valor de Referencia</div>
              <div className="text-2xl font-black text-white mt-0.5 tabular-nums">
                ${reporte.valor_total_flota.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#B8B2A6]">Activos de la empresa</div>
            </div>

            <div>
              <div className="text-[10px] uppercase text-[#B8B2A6]">Total Unidades</div>
              <div className="text-2xl font-black text-[#C5A059] mt-0.5 tabular-nums">
                {reporte.total_unidades}
              </div>
              <div className="text-[10px] text-[#B8B2A6]">Tractos, cajas y thermos</div>
            </div>
          </div>

          {/* Semáforo de los 5 Estados */}
          <div>
            <h4 className="mb-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#B8B2A6]">
              Distribución de los 5 Estados de Salud de Flota
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-['Barlow_Condensed']">
              <div className="rounded-xl border border-[#3FA65C]/30 bg-[#3FA65C]/10 p-3">
                <div className="flex items-center gap-1.5 text-[#3FA65C] font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Activo 100%</span>
                </div>
                <div className="text-xl font-black text-white mt-1 tabular-nums">
                  {reporte.distribucion_salud.activo_100}
                </div>
              </div>

              <div className="rounded-xl border border-[#E0C36A]/30 bg-[#E0C36A]/10 p-3">
                <div className="flex items-center gap-1.5 text-[#E0C36A] font-bold">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Warning</span>
                </div>
                <div className="text-xl font-black text-white mt-1 tabular-nums">
                  {reporte.distribucion_salud.warning}
                </div>
              </div>

              <div className="rounded-xl border border-[#F2620F]/30 bg-[#F2620F]/10 p-3">
                <div className="flex items-center gap-1.5 text-[#F2620F] font-bold">
                  <Clock className="h-3.5 w-3.5" />
                  <span>En Reparación</span>
                </div>
                <div className="text-xl font-black text-white mt-1 tabular-nums">
                  {reporte.distribucion_salud.reparacion}
                </div>
              </div>

              <div className="rounded-xl border border-[rgba(243,239,231,0.15)] bg-white/5 p-3">
                <div className="flex items-center gap-1.5 text-[#C5A059] font-bold">
                  <Recycle className="h-3.5 w-3.5" />
                  <span>En Yonke</span>
                </div>
                <div className="text-xl font-black text-white mt-1 tabular-nums">
                  {reporte.distribucion_salud.yonke}
                </div>
              </div>

              <div className="rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] p-3">
                <div className="flex items-center gap-1.5 text-[#B8B2A6] font-bold">
                  <Archive className="h-3.5 w-3.5" />
                  <span>Baja Definitiva</span>
                </div>
                <div className="text-xl font-black text-white mt-1 tabular-nums">
                  {reporte.distribucion_salud.baja}
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Tractos y TCO */}
          <div>
            <h4 className="mb-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#B8B2A6]">
              Matriz de TCO y Alerta de Candidatas a Yonke
            </h4>
            <div className="overflow-x-auto rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/40">
              <table className="w-full text-left text-xs text-[#f3f4f6]">
                <thead className="border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] font-['Barlow_Condensed'] uppercase tracking-wider text-[#B8B2A6]">
                  <tr>
                    <th className="px-4 py-2.5">Unidad</th>
                    <th className="px-4 py-2.5">Tipo</th>
                    <th className="px-4 py-2.5">Estado de Salud</th>
                    <th className="px-4 py-2.5 text-right">Costo Acumulado</th>
                    <th className="px-4 py-2.5 text-right">Valor Ref.</th>
                    <th className="px-4 py-2.5 text-right">% TCO</th>
                    <th className="px-4 py-2.5 text-center">Diagnóstico Financiero</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(243,239,231,0.06)] font-['Barlow']">
                  {reporte.unidades.map(u => (
                    <tr key={u.id_unidad} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 font-bold text-white font-mono">
                        {u.id_unidad}
                      </td>
                      <td className="px-4 py-2.5 text-[#B8B2A6]">{u.tipo}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded px-2 py-0.5 font-['Barlow_Condensed'] text-[10px] font-bold ${
                            u.estado_salud === 'Activo al 100%'
                              ? 'bg-[#3FA65C]/20 text-[#3FA65C]'
                              : u.estado_salud === 'Activo con Warning'
                              ? 'bg-[#E0C36A]/20 text-[#E0C36A]'
                              : u.estado_salud === 'Inactivo en Reparación'
                              ? 'bg-[#F2620F]/20 text-[#F2620F]'
                              : 'bg-white/10 text-[#B8B2A6]'
                          }`}
                        >
                          {u.estado_salud}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-['Barlow_Condensed'] font-bold text-white tabular-nums">
                        ${u.costo_acumulado.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right font-['Barlow_Condensed'] text-[#B8B2A6] tabular-nums">
                        ${u.valor_referencia.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right font-['Barlow_Condensed'] font-black tabular-nums">
                        <span
                          className={
                            u.porcentaje_consumido >= 70
                              ? 'text-[#F2620F]'
                              : u.porcentaje_consumido >= 40
                              ? 'text-[#E0C36A]'
                              : 'text-[#3FA65C]'
                          }
                        >
                          {u.porcentaje_consumido}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {u.candidata_yonke ? (
                          <span className="rounded bg-[#F2620F]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-[10px] font-bold text-[#F2620F]">
                            ⚠️ Candidata a Yonke
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#3FA65C]">Saludable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            Cerrar Reporte
          </button>
        </div>
      </div>
    </div>
  )
}
