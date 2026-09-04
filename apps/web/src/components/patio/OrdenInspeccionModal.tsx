import React from 'react'
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Truck, 
  User, 
  Gauge, 
  Fuel, 
  FileText 
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import type { OrdenInspeccionForm } from '../../lib/inspeccionSchema'

interface Props {
  inspeccion: OrdenInspeccionForm | null
  abierto: boolean
  alCerrar: () => void
}

export const OrdenInspeccionModal: React.FC<Props> = ({ inspeccion, abierto, alCerrar }) => {
  if (!abierto || !inspeccion) return null

  // Calcular el estado resultante de salud de la unidad
  const tieneCritico = inspeccion.items.some(i => i.estado === 'Crítico')
  const tieneRegular = inspeccion.items.some(i => i.estado === 'Regular')

  const estadoSalud = tieneCritico
    ? 'Inactivo en Reparación'
    : tieneRegular
    ? 'Activo con Warning'
    : 'Activo al 100%'

  const colorSalud = tieneCritico
    ? 'bg-[#B4430A]/20 text-[#F2620F] border-[#F2620F]/40'
    : tieneRegular
    ? 'bg-[#E0C36A]/20 text-[#E0C36A] border-[#E0C36A]/40'
    : 'bg-[#3FA65C]/20 text-[#3FA65C] border-[#3FA65C]/40'

  const descargarPdf = () => {
    const doc = new jsPDF()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('WARHORSE MÉXICO', 14, 20)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('HOJA OFICIAL DE INSPECCIÓN FÍSICA Y CONTROL DE PATIO', 14, 26)
    doc.line(14, 30, 196, 30)

    doc.setFont('helvetica', 'bold')
    doc.text(`FOLIO: ${inspeccion.folio}`, 14, 38)
    doc.text(`FECHA: ${inspeccion.fecha}`, 120, 38)
    doc.text(`UNIDAD: ${inspeccion.unidad_id}`, 14, 46)
    doc.text(`OPERADOR: ${inspeccion.operador_nombre} (${inspeccion.operador_id})`, 14, 54)
    doc.text(`TIPO OPERACIÓN: ${inspeccion.tipo_operacion}`, 120, 46)
    doc.text(`ODÓMETRO: ${inspeccion.kilometraje.toLocaleString()} KM`, 120, 54)
    doc.text(`ESTADO RESULTANTE: ${estadoSalud.toUpperCase()}`, 14, 64)

    doc.line(14, 68, 196, 68)
    doc.setFont('helvetica', 'bold')
    doc.text('EVALUACIÓN DE COMPONENTES:', 14, 76)
    
    let y = 84
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    inspeccion.items.forEach(item => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      doc.text(`• [${item.estado}] ${item.sistema} - ${item.componente}`, 14, y)
      if (item.observacion) {
        y += 5
        doc.text(`   Obs: ${item.observacion}`, 18, y)
      }
      y += 6
    })

    y += 10
    doc.line(14, y, 196, y)
    y += 12
    doc.setFont('helvetica', 'bold')
    doc.text(`FIRMA DIGITAL: ${inspeccion.firma_digital}`, 14, y)
    doc.text(`CERTIFICADO POR: SISTEMA WARHORSE PATIO OFFLINE`, 14, y + 6)

    doc.save(`Orden_Inspeccion_${inspeccion.folio}.pdf`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del Documento */}
        <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2620F] text-[#16191E]">
              <FileText className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-widest text-[#C5A059]">
                DOCUMENTO ADJUNTO OFICIAL
              </span>
              <h3 className="font-['Barlow_Condensed'] text-xl font-extrabold uppercase tracking-wide text-white">
                Orden de Inspección de Unidad ({inspeccion.folio})
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={descargarPdf}
              className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3.5 py-2 text-xs font-semibold text-[#f3f4f6] hover:border-[#F2620F] hover:text-[#F2620F] transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3.5 py-2 text-xs font-semibold text-[#f3f4f6] hover:border-white transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={alCerrar}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-[#B8B2A6] hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenido Imprimible de la Orden */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Tarjeta de Veredicto de Salud */}
          <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border p-4 ${colorSalud}`}>
            <div className="flex items-center gap-3">
              {tieneCritico ? (
                <ShieldAlert className="h-8 w-8 shrink-0" />
              ) : tieneRegular ? (
                <AlertTriangle className="h-8 w-8 shrink-0" />
              ) : (
                <CheckCircle2 className="h-8 w-8 shrink-0" />
              )}
              <div>
                <div className="text-[11px] uppercase font-['Barlow_Condensed'] font-semibold tracking-wider">
                  Veredicto de Salud Resultante
                </div>
                <div className="font-['Barlow_Condensed'] text-2xl font-black uppercase tracking-wide">
                  {estadoSalud}
                </div>
              </div>
            </div>

            <div className="mt-3 sm:mt-0 text-left sm:text-right text-xs">
              <span className="font-semibold">
                {tieneCritico
                  ? '⚠️ Requiere Apertura Inmediata de OT Correctiva en Taller'
                  : tieneRegular
                  ? '⚠️ Falla Menor Registrada: Unidad liberada con Advertencia'
                  : '✅ Unidad 100% Lista para Operación'}
              </span>
            </div>
          </div>

          {/* Cuadrícula de Metadatos del Tracto y Operador */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#1C1C1C]/60 p-4">
            <div>
              <div className="flex items-center gap-1 text-[11px] text-[#B8B2A6]">
                <Truck className="h-3 w-3 text-[#F2620F]" />
                <span>Unidad</span>
              </div>
              <div className="font-['Barlow_Condensed'] text-lg font-bold text-white mt-0.5">
                {inspeccion.unidad_id}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-[11px] text-[#B8B2A6]">
                <User className="h-3 w-3 text-[#C5A059]" />
                <span>Operador</span>
              </div>
              <div className="truncate font-['Barlow_Condensed'] text-base font-bold text-white mt-0.5">
                {inspeccion.operador_nombre}
              </div>
              <div className="text-[10px] text-[#B8B2A6]">{inspeccion.licencia}</div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-[11px] text-[#B8B2A6]">
                <Gauge className="h-3 w-3 text-[#3FA65C]" />
                <span>Odómetro</span>
              </div>
              <div className="font-['Barlow_Condensed'] text-base font-bold tabular-nums text-white mt-0.5">
                {inspeccion.kilometraje.toLocaleString()} KM
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-[11px] text-[#B8B2A6]">
                <Fuel className="h-3 w-3 text-[#E0C36A]" />
                <span>Combustible</span>
              </div>
              <div className="font-['Barlow_Condensed'] text-base font-bold text-white mt-0.5">
                {inspeccion.nivel_combustible}
              </div>
            </div>
          </div>

          {/* Desglose de Componentes Evaluados */}
          <div>
            <h4 className="mb-3 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider text-[#B8B2A6]">
              Matriz de Inspección por Sistemas
            </h4>
            <div className="rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#1C1C1C]/40 overflow-hidden">
              <table className="w-full text-left text-xs text-[#f3f4f6]">
                <thead className="border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] font-['Barlow_Condensed'] uppercase tracking-wider text-[#B8B2A6]">
                  <tr>
                    <th className="px-4 py-2.5">Sistema</th>
                    <th className="px-4 py-2.5">Componente</th>
                    <th className="px-4 py-2.5">Estado</th>
                    <th className="px-4 py-2.5">Observación / Falla</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(243,239,231,0.06)]">
                  {inspeccion.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2 text-[11px] text-[#B8B2A6] font-medium">{item.sistema}</td>
                      <td className="px-4 py-2 font-semibold text-white">{item.componente}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-['Barlow_Condensed'] text-[11px] font-bold ${
                            item.estado === 'Crítico'
                              ? 'bg-[#B4430A]/20 text-[#F2620F]'
                              : item.estado === 'Regular'
                              ? 'bg-[#E0C36A]/20 text-[#E0C36A]'
                              : 'bg-[#3FA65C]/20 text-[#3FA65C]'
                          }`}
                        >
                          {item.estado}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-[11px] text-[#B8B2A6]">
                        {item.observacion || '— Sin anomalías —'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Firmas y Sellos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[rgba(243,239,231,0.1)] pt-4">
            <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/40 p-3">
              <div className="text-[10px] uppercase tracking-wider text-[#B8B2A6] font-['Barlow_Condensed'] font-semibold">
                Firma Digital del Operador
              </div>
              <div className="mt-2 font-mono text-xs text-[#3FA65C] bg-black/40 p-2 rounded border border-[#3FA65C]/30">
                ✓ {inspeccion.firma_digital}
              </div>
              <div className="text-[10px] text-[#B8B2A6] mt-1">
                Registrado con sello de tiempo: {inspeccion.fecha}
              </div>
            </div>

            <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/40 p-3">
              <div className="text-[10px] uppercase tracking-wider text-[#B8B2A6] font-['Barlow_Condensed'] font-semibold">
                Trazabilidad y Sincronización
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-[#f3f4f6]">Persistencia IndexDB:</span>
                <span className="rounded bg-[#3FA65C]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-[11px] font-bold text-[#3FA65C]">
                  GUARDADO LOCAL
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-[#f3f4f6]">Alerta a Taller:</span>
                <span className="font-['Barlow_Condensed'] text-xs font-bold text-[#F2620F]">
                  {inspeccion.requiere_ot ? 'NOTIFICADO' : 'NO REQUERIDA'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pie del modal */}
        <div className="border-t border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-6 py-4 flex items-center justify-between">
          <span className="text-[11px] text-[#B8B2A6] hidden sm:inline">
            Documento indexado con firma digital válida
          </span>
          <button
            type="button"
            onClick={alCerrar}
            className="w-full sm:w-auto rounded-xl bg-[#F2620F] px-8 h-12 font-['Barlow_Condensed'] text-sm font-extrabold uppercase tracking-wider text-[#16191E] shadow-xl shadow-[#F2620F]/20 hover:bg-[#D9550C] active:scale-[0.98] transition-all cursor-pointer"
          >
            Aceptar y Continuar
          </button>
        </div>
      </div>
    </div>
  )
}
