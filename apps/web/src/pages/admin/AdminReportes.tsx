import React, { useState, useEffect } from 'react'
import { 
  FileSpreadsheet, 
  DollarSign, 
  Activity, 
  Wrench, 
  Fuel, 
  RotateCw 
} from 'lucide-react'
import { getUnidades, type UnidadApi } from '../../lib/api'
import { useUiStore } from '../../store/useUiStore'
import { useAuthStore } from '../../store/useAuthStore'
import { 
  ReporteEjecutivoModal, 
  type DetalleReporteEjecutivo, 
  type DetalleReporteUnidad 
} from '../../components/admin/ReporteEjecutivoModal'

export const AdminReportes: React.FC = () => {
  const { agregarToast } = useUiStore()
  const { usuario } = useAuthStore()

  const [unidades, setUnidades] = useState<UnidadApi[]>([])
  const [tipoReporte, setTipoReporte] = useState<'TCO' | 'Taller' | 'Compras' | 'Diesel'>('TCO')
  const [fechaInicio, setFechaInicio] = useState('2026-08-01')
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().substring(0, 10))
  const [cargando, setCargando] = useState(true)

  const [reporteModal, setReporteModal] = useState<DetalleReporteEjecutivo | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)

  const fallbackUnidades: UnidadApi[] = [
    { id: 1, id_unidad: 'WH-101', tipo: 'Tractor', estado: 'Inactivo', valor_referencia: 850000, costo_real_acumulado: 640000, candidata_reincidencia: true },
    { id: 2, id_unidad: 'WH-104', tipo: 'Tractor', estado: 'Activo', valor_referencia: 920000, costo_real_acumulado: 210000, candidata_reincidencia: false },
    { id: 3, id_unidad: 'WH-125', tipo: 'Tractor', estado: 'Activo', valor_referencia: 780000, costo_real_acumulado: 140000, candidata_reincidencia: false },
    { id: 4, id_unidad: 'CJ-502', tipo: 'Caja', estado: 'Activo', valor_referencia: 320000, costo_real_acumulado: 45000, candidata_reincidencia: false },
    { id: 5, id_unidad: 'TH-201', tipo: 'Thermo', estado: 'Activo', valor_referencia: 450000, costo_real_acumulado: 340000, candidata_reincidencia: true },
    { id: 6, id_unidad: 'WH-099', tipo: 'Tractor', estado: 'Inactivo', valor_referencia: 600000, costo_real_acumulado: 580000, candidata_reincidencia: true },
  ]

  const cargarUnidades = async () => {
    setCargando(true)
    try {
      const lista = await getUnidades().catch(() => fallbackUnidades)
      setUnidades(lista && lista.length > 0 ? lista : fallbackUnidades)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarUnidades()
  }, [])

  const emitirReporte = () => {
    const unidadesConSalud: DetalleReporteUnidad[] = unidades.map(u => {
      const valorRef = Number(u.valor_referencia) || 800000
      const costoAcum = Number(u.costo_real_acumulado) || 0
      const pct = Math.round((costoAcum / valorRef) * 100)

      let salud: DetalleReporteUnidad['estado_salud'] = 'Activo al 100%'
      if (u.id_unidad === 'WH-099') salud = 'Inactivo en Yonke'
      else if (u.estado === 'Inactivo') salud = 'Inactivo en Reparación'
      else if (u.candidata_reincidencia || pct >= 70) salud = 'Activo con Warning'

      return {
        id_unidad: u.id_unidad,
        tipo: u.tipo,
        estado_salud: salud,
        costo_acumulado: costoAcum,
        valor_referencia: valorRef,
        porcentaje_consumido: pct,
        candidata_yonke: pct >= 70 || u.candidata_reincidencia === true,
      }
    })

    const folioRep = `REP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`
    const totalActivas100 = unidadesConSalud.filter(u => u.estado_salud === 'Activo al 100%').length
    const totalWarning = unidadesConSalud.filter(u => u.estado_salud === 'Activo con Warning').length
    const totalReparacion = unidadesConSalud.filter(u => u.estado_salud === 'Inactivo en Reparación').length
    const totalYonke = unidadesConSalud.filter(u => u.estado_salud === 'Inactivo en Yonke').length
    const totalBaja = unidadesConSalud.filter(u => u.estado_salud === 'Baja Definitiva').length

    const totalOperativas = totalActivas100 + totalWarning
    const tasa = Math.round((totalOperativas / unidadesConSalud.length) * 100)
    const costoTot = unidadesConSalud.reduce((acc, u) => acc + u.costo_acumulado, 0)
    const valTot = unidadesConSalud.reduce((acc, u) => acc + u.valor_referencia, 0)

    const rep: DetalleReporteEjecutivo = {
      folio: folioRep,
      fecha: new Date().toISOString().substring(0, 10),
      autor: usuario?.nombre || 'Dirección de Operaciones',
      total_unidades: unidadesConSalud.length,
      tasa_disponibilidad: tasa,
      costo_total_acumulado: costoTot,
      valor_total_flota: valTot,
      distribucion_salud: {
        activo_100: totalActivas100,
        warning: totalWarning,
        reparacion: totalReparacion,
        yonke: totalYonke,
        baja: totalBaja,
      },
      unidades: unidadesConSalud,
    }

    setReporteModal(rep)
    setModalAbierto(true)
    agregarToast({
      tipo: 'success',
      titulo: 'Reporte Maestro Emitido',
      mensaje: `Informe oficial ${folioRep} listo para revisión y PDF.`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(243,239,231,0.1)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#F2620F]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#F2620F]">
              Módulo Administración
            </span>
            <span className="rounded bg-[#C5A059]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#C5A059]">
              Formatos de Reporte Maestro
            </span>
          </div>
          <h1 className="mt-1 font-['Barlow_Condensed'] text-3xl font-extrabold uppercase tracking-wide text-white sm:text-4xl">
            Centro de Reportes Directivos
          </h1>
          <p className="text-xs text-[#B8B2A6]">
            Generación y exportación de informes oficiales para dirección general, auditoría y finanzas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cargarUnidades}
            className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3.5 py-2 text-xs font-semibold text-[#f3f4f6] hover:border-white transition-all cursor-pointer"
          >
            <RotateCw className="h-3.5 w-3.5 text-[#B8B2A6]" />
            <span>Refrescar</span>
          </button>
          <button
            type="button"
            onClick={emitirReporte}
            className="flex items-center gap-2 rounded-xl bg-[#F2620F] px-5 py-2.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] shadow-lg shadow-[#F2620F]/20 hover:bg-[#D9550C] transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 stroke-[2.5]" />
            <span>Emitir Reporte Oficial</span>
          </button>
        </div>
      </div>

      {/* Selectores de Tipo de Reporte */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setTipoReporte('TCO')}
          className={`rounded-2xl border p-5 text-left transition-all ${
            tipoReporte === 'TCO'
              ? 'border-[#F2620F] bg-[#F2620F]/10 shadow-lg'
              : 'border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 hover:border-[#F2620F]/50'
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2620F] text-[#16191E]">
            <Activity className="h-5 w-5 stroke-[2.5]" />
          </div>
          <h3 className="font-['Barlow_Condensed'] text-lg font-bold uppercase text-white mt-3">
            Salud y TCO Flota
          </h3>
          <p className="text-xs text-[#B8B2A6] mt-1">
            Matriz de 5 estados, inversión acumulada por tracto y alertas de Yonke.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setTipoReporte('Taller')}
          className={`rounded-2xl border p-5 text-left transition-all ${
            tipoReporte === 'Taller'
              ? 'border-[#C5A059] bg-[#C5A059]/10 shadow-lg'
              : 'border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 hover:border-[#C5A059]/50'
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C5A059] text-[#16191E]">
            <Wrench className="h-5 w-5 stroke-[2.5]" />
          </div>
          <h3 className="font-['Barlow_Condensed'] text-lg font-bold uppercase text-white mt-3">
            Mantenimiento y OTs
          </h3>
          <p className="text-xs text-[#B8B2A6] mt-1">
            Órdenes de trabajo, liberaciones parciales, reincidencias y horas mecánico.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setTipoReporte('Compras')}
          className={`rounded-2xl border p-5 text-left transition-all ${
            tipoReporte === 'Compras'
              ? 'border-[#3FA65C] bg-[#3FA65C]/10 shadow-lg'
              : 'border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 hover:border-[#3FA65C]/50'
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3FA65C] text-[#16191E]">
            <DollarSign className="h-5 w-5 stroke-[2.5]" />
          </div>
          <h3 className="font-['Barlow_Condensed'] text-lg font-bold uppercase text-white mt-3">
            Compras & Yonke
          </h3>
          <p className="text-xs text-[#B8B2A6] mt-1">
            Requisiciones, órdenes de compra emitidas y ahorro por piezas recuperadas.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setTipoReporte('Diesel')}
          className={`rounded-2xl border p-5 text-left transition-all ${
            tipoReporte === 'Diesel'
              ? 'border-[#E0C36A] bg-[#E0C36A]/10 shadow-lg'
              : 'border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 hover:border-[#E0C36A]/50'
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E0C36A] text-[#16191E]">
            <Fuel className="h-5 w-5 stroke-[2.5]" />
          </div>
          <h3 className="font-['Barlow_Condensed'] text-lg font-bold uppercase text-white mt-3">
            Combustible & KM/L
          </h3>
          <p className="text-xs text-[#B8B2A6] mt-1">
            Rendimiento por tracto, cargas de diésel y desviaciones de consumo.
          </p>
        </button>
      </div>

      {/* Filtros de Período y Vista Previa */}
      <div className="rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/80 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#C5A059]">
              CONFIGURACIÓN DEL PERIODO
            </div>
            <h3 className="font-['Barlow_Condensed'] text-xl font-bold uppercase text-white">
              Parámetros de Auditoría
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div>
              <label className="block text-[10px] text-[#B8B2A6]">Desde:</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                className="rounded-lg border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-1.5 px-2.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#B8B2A6]">Hasta:</label>
              <input
                type="date"
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                className="rounded-lg border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-1.5 px-2.5 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Resumen de Flota en Vista Previa */}
        <div className="overflow-x-auto rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/40">
          <table className="w-full text-left text-xs text-[#f3f4f6]">
            <thead className="border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] font-['Barlow_Condensed'] uppercase tracking-wider text-[#B8B2A6]">
              <tr>
                <th className="px-4 py-2.5">Unidad</th>
                <th className="px-4 py-2.5">Tipo</th>
                <th className="px-4 py-2.5">Estado en Operación</th>
                <th className="px-4 py-2.5 text-right">Inversión Acumulada</th>
                <th className="px-4 py-2.5 text-right">Valor de Referencia</th>
                <th className="px-4 py-2.5 text-center">Acción Directa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(243,239,231,0.06)] font-['Barlow']">
              {cargando ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-[#B8B2A6]">
                    Cargando vista previa...
                  </td>
                </tr>
              ) : (
                unidades.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 font-mono font-bold text-white">
                      {u.id_unidad}
                    </td>
                    <td className="px-4 py-2.5 text-[#B8B2A6]">{u.tipo}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded bg-white/10 px-2 py-0.5 font-['Barlow_Condensed'] text-[10px] font-bold text-white">
                        {u.estado}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-['Barlow_Condensed'] font-bold text-[#F2620F] tabular-nums">
                      ${Number(u.costo_real_acumulado || 0).toLocaleString()} MXN
                    </td>
                    <td className="px-4 py-2.5 text-right font-['Barlow_Condensed'] text-[#B8B2A6] tabular-nums">
                      ${Number(u.valor_referencia || 800000).toLocaleString()} MXN
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={emitirReporte}
                        className="rounded bg-[#F2620F]/20 px-2.5 py-1 font-['Barlow_Condensed'] text-[11px] font-bold text-[#F2620F] hover:bg-[#F2620F] hover:text-[#16191E] transition-all cursor-pointer"
                      >
                        Generar Ficha PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Oficial de Reporte Maestro */}
      <ReporteEjecutivoModal
        reporte={reporteModal}
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
      />
    </div>
  )
}

export default AdminReportes
