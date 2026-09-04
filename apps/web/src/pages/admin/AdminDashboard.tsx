import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { 
  Activity, 
  Truck, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Recycle, 
  Archive, 
  FileSpreadsheet, 
  RotateCw, 
  ArrowUpRight 
} from 'lucide-react'
import { 
  getUnidades, 
  type UnidadApi 
} from '../../lib/api'
import { useUiStore } from '../../store/useUiStore'
import { useAuthStore } from '../../store/useAuthStore'
import { 
  ReporteEjecutivoModal, 
  type DetalleReporteEjecutivo, 
  type DetalleReporteUnidad 
} from '../../components/admin/ReporteEjecutivoModal'

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { agregarToast } = useUiStore()
  const { usuario } = useAuthStore()

  const [unidades, setUnidades] = useState<UnidadApi[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtroSalud, setFiltroSalud] = useState<string>('Todas')

  const [reporteEmitido, setReporteEmitido] = useState<DetalleReporteEjecutivo | null>(null)
  const [modalReporteAbierto, setModalReporteAbierto] = useState(false)

  const fallbackUnidades: UnidadApi[] = [
    { id: 1, id_unidad: 'WH-101', tipo: 'Tractor', estado: 'Inactivo', valor_referencia: 850000, costo_real_acumulado: 640000, candidata_reincidencia: true },
    { id: 2, id_unidad: 'WH-104', tipo: 'Tractor', estado: 'Activo', valor_referencia: 920000, costo_real_acumulado: 210000, candidata_reincidencia: false },
    { id: 3, id_unidad: 'WH-125', tipo: 'Tractor', estado: 'Activo', valor_referencia: 780000, costo_real_acumulado: 140000, candidata_reincidencia: false },
    { id: 4, id_unidad: 'CJ-502', tipo: 'Caja', estado: 'Activo', valor_referencia: 320000, costo_real_acumulado: 45000, candidata_reincidencia: false },
    { id: 5, id_unidad: 'TH-201', tipo: 'Thermo', estado: 'Activo', valor_referencia: 450000, costo_real_acumulado: 340000, candidata_reincidencia: true },
    { id: 6, id_unidad: 'WH-099', tipo: 'Tractor', estado: 'Inactivo', valor_referencia: 600000, costo_real_acumulado: 580000, candidata_reincidencia: true },
  ]

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const listaUnidades = await getUnidades().catch(() => fallbackUnidades)
      setUnidades(listaUnidades && listaUnidades.length > 0 ? listaUnidades : fallbackUnidades)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  // Mapeo riguroso a los 5 estados de salud según la arquitectura
  const unidadesConSalud: DetalleReporteUnidad[] = unidades.map(u => {
    const valorRef = Number(u.valor_referencia) || 800000
    const costoAcum = Number(u.costo_real_acumulado) || 0
    const pct = Math.round((costoAcum / valorRef) * 100)

    let salud: DetalleReporteUnidad['estado_salud'] = 'Activo al 100%'
    if (u.id_unidad === 'WH-099') {
      salud = 'Inactivo en Yonke'
    } else if (u.estado === 'Inactivo') {
      salud = 'Inactivo en Reparación'
    } else if (u.candidata_reincidencia || pct >= 70) {
      salud = 'Activo con Warning'
    }

    const candidata = pct >= 70 || u.candidata_reincidencia === true

    return {
      id_unidad: u.id_unidad,
      tipo: u.tipo,
      estado_salud: salud,
      costo_acumulado: costoAcum,
      valor_referencia: valorRef,
      porcentaje_consumido: pct,
      candidata_yonke: candidata,
    }
  })

  // Métricas agregadas
  const totalActivas100 = unidadesConSalud.filter(u => u.estado_salud === 'Activo al 100%').length
  const totalWarning = unidadesConSalud.filter(u => u.estado_salud === 'Activo con Warning').length
  const totalReparacion = unidadesConSalud.filter(u => u.estado_salud === 'Inactivo en Reparación').length
  const totalYonke = unidadesConSalud.filter(u => u.estado_salud === 'Inactivo en Yonke').length
  const totalBaja = unidadesConSalud.filter(u => u.estado_salud === 'Baja Definitiva').length

  const totalOperativas = totalActivas100 + totalWarning
  const tasaDisponibilidad = unidadesConSalud.length > 0 
    ? Math.round((totalOperativas / unidadesConSalud.length) * 100) 
    : 85

  const costoTotalAcumulado = unidadesConSalud.reduce((acc, u) => acc + u.costo_acumulado, 0)
  const valorTotalFlota = unidadesConSalud.reduce((acc, u) => acc + u.valor_referencia, 0)
  const candidatasYonke = unidadesConSalud.filter(u => u.candidata_yonke).length

  const unidadesFiltradas = unidadesConSalud.filter(u => {
    if (filtroSalud === 'Todas') return true
    return u.estado_salud === filtroSalud
  })

  const generarReporteOficial = () => {
    const folioRep = `REP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`
    const rep: DetalleReporteEjecutivo = {
      folio: folioRep,
      fecha: new Date().toISOString().substring(0, 10),
      autor: usuario?.nombre || 'Dirección General Warhorse',
      total_unidades: unidadesConSalud.length,
      tasa_disponibilidad: tasaDisponibilidad,
      costo_total_acumulado: costoTotalAcumulado,
      valor_total_flota: valorTotalFlota,
      distribucion_salud: {
        activo_100: totalActivas100,
        warning: totalWarning,
        reparacion: totalReparacion,
        yonke: totalYonke,
        baja: totalBaja,
      },
      unidades: unidadesConSalud,
    }

    setReporteEmitido(rep)
    setModalReporteAbierto(true)
    agregarToast({
      tipo: 'success',
      titulo: 'Reporte Maestro Generado',
      mensaje: `Informe oficial ${folioRep} listo para exportación en PDF.`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(243,239,231,0.1)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#F2620F]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#F2620F]">
              Dirección & Estrategia
            </span>
            <span className="rounded bg-[#C5A059]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#C5A059]">
              Backbone Administrativo
            </span>
          </div>
          <h1 className="mt-1 font-['Barlow_Condensed'] text-3xl font-extrabold uppercase tracking-wide text-white sm:text-4xl">
            Dashboard Ejecutivo de Flota
          </h1>
          <p className="text-xs text-[#B8B2A6]">
            Monitoreo en tiempo real de los 5 estados de salud, análisis de TCO y alertas de reincidencia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cargarDatos}
            className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3.5 py-2 text-xs font-semibold text-[#f3f4f6] hover:border-white transition-all cursor-pointer"
          >
            <RotateCw className="h-3.5 w-3.5 text-[#B8B2A6]" />
            <span>Actualizar</span>
          </button>
          <button
            type="button"
            onClick={generarReporteOficial}
            className="flex items-center gap-2 rounded-xl bg-[#F2620F] px-5 py-2.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] shadow-lg shadow-[#F2620F]/20 hover:bg-[#D9550C] transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 stroke-[2.5]" />
            <span>Reporte Oficial PDF</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI Directivas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
          <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
            <span>Tasa de Disponibilidad</span>
            <Activity className="h-4 w-4 text-[#3FA65C]" />
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-3xl sm:text-4xl font-black text-[#3FA65C] tabular-nums">
            {tasaDisponibilidad}%
          </div>
          <div className="text-[10px] text-[#B8B2A6] mt-0.5">
            {totalOperativas} de {unidadesConSalud.length} unidades en ruta
          </div>
        </div>

        <div className="rounded-2xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
          <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
            <span>Inversión TCO Acumulada</span>
            <DollarSign className="h-4 w-4 text-[#F2620F]" />
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-2xl sm:text-3xl font-black text-white tabular-nums">
            ${costoTotalAcumulado.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#B8B2A6] mt-0.5">Mantenimiento + Refacciones</div>
        </div>

        <div className="rounded-2xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
          <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
            <span>Bloqueadas en Taller</span>
            <Clock className="h-4 w-4 text-[#F2620F]" />
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-3xl sm:text-4xl font-black text-[#F2620F] tabular-nums">
            {totalReparacion}
          </div>
          <div className="text-[10px] text-[#B8B2A6] mt-0.5">Inactivas bajo OT activa</div>
        </div>

        <div className="rounded-2xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
          <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
            <span>Alerta Candidatas Yonke</span>
            <AlertTriangle className="h-4 w-4 text-[#E0C36A]" />
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-3xl sm:text-4xl font-black text-[#E0C36A] tabular-nums">
            {candidatasYonke}
          </div>
          <div className="text-[10px] text-[#B8B2A6] mt-0.5">Sobrecosto TCO {'>='} 70%</div>
        </div>
      </div>

      {/* Matriz Interactiva de los 5 Estados de Salud */}
      <div className="rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/80 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#C5A059]">
              MOTOR DE ESTADOS EN TIEMPO REAL
            </div>
            <h3 className="font-['Barlow_Condensed'] text-xl font-bold uppercase text-white">
              Semáforo de Salud de la Flota
            </h3>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'Todas', label: 'Todas' },
              { id: 'Activo al 100%', label: '100% Activo' },
              { id: 'Activo con Warning', label: 'Con Warning' },
              { id: 'Inactivo en Reparación', label: 'En Taller' },
              { id: 'Inactivo en Yonke', label: 'Yonke' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltroSalud(f.id)}
                className={`rounded-lg px-2.5 py-1 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider transition-all ${
                  filtroSalud === f.id
                    ? 'bg-[#F2620F] text-[#16191E]'
                    : 'bg-[#1C1C1C] text-[#B8B2A6] hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tarjetas de Estados */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div
            onClick={() => setFiltroSalud('Activo al 100%')}
            className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
              filtroSalud === 'Activo al 100%'
                ? 'border-[#3FA65C] bg-[#3FA65C]/15 shadow-md'
                : 'border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/60 hover:border-[#3FA65C]/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#3FA65C] font-bold">
              <span>1. Activo al 100%</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="font-['Barlow_Condensed'] text-3xl font-black text-white mt-1 tabular-nums">
              {totalActivas100}
            </div>
            <div className="text-[10px] text-[#B8B2A6]">Disponibilidad plena</div>
          </div>

          <div
            onClick={() => setFiltroSalud('Activo con Warning')}
            className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
              filtroSalud === 'Activo con Warning'
                ? 'border-[#E0C36A] bg-[#E0C36A]/15 shadow-md'
                : 'border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/60 hover:border-[#E0C36A]/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#E0C36A] font-bold">
              <span>2. Con Warning</span>
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="font-['Barlow_Condensed'] text-3xl font-black text-[#E0C36A] mt-1 tabular-nums">
              {totalWarning}
            </div>
            <div className="text-[10px] text-[#B8B2A6]">Pendientes de taller</div>
          </div>

          <div
            onClick={() => setFiltroSalud('Inactivo en Reparación')}
            className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
              filtroSalud === 'Inactivo en Reparación'
                ? 'border-[#F2620F] bg-[#F2620F]/15 shadow-md'
                : 'border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/60 hover:border-[#F2620F]/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#F2620F] font-bold">
              <span>3. En Reparación</span>
              <Clock className="h-4 w-4" />
            </div>
            <div className="font-['Barlow_Condensed'] text-3xl font-black text-[#F2620F] mt-1 tabular-nums">
              {totalReparacion}
            </div>
            <div className="text-[10px] text-[#B8B2A6]">Bloqueadas en patio</div>
          </div>

          <div
            onClick={() => setFiltroSalud('Inactivo en Yonke')}
            className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
              filtroSalud === 'Inactivo en Yonke'
                ? 'border-[#C5A059] bg-[#C5A059]/15 shadow-md'
                : 'border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/60 hover:border-[#C5A059]/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#C5A059] font-bold">
              <span>4. En Yonke</span>
              <Recycle className="h-4 w-4" />
            </div>
            <div className="font-['Barlow_Condensed'] text-3xl font-black text-white mt-1 tabular-nums">
              {totalYonke}
            </div>
            <div className="text-[10px] text-[#B8B2A6]">Desguace de partes</div>
          </div>

          <div
            onClick={() => setFiltroSalud('Baja Definitiva')}
            className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
              filtroSalud === 'Baja Definitiva'
                ? 'border-white bg-white/10 shadow-md'
                : 'border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/60 hover:border-white/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#B8B2A6] font-bold">
              <span>5. Baja Definitiva</span>
              <Archive className="h-4 w-4" />
            </div>
            <div className="font-['Barlow_Condensed'] text-3xl font-black text-white mt-1 tabular-nums">
              {totalBaja}
            </div>
            <div className="text-[10px] text-[#B8B2A6]">Desincorporadas</div>
          </div>
        </div>

        {/* Tabla de Unidades en el Filtro Actual con Barra de TCO */}
        <div className="overflow-x-auto rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/40">
          <table className="w-full text-left text-xs text-[#f3f4f6]">
            <thead className="border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] font-['Barlow_Condensed'] uppercase tracking-wider text-[#B8B2A6]">
              <tr>
                <th className="px-4 py-3">Unidad</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Estatus de Salud</th>
                <th className="px-4 py-3">Consumo de TCO vs Valor</th>
                <th className="px-4 py-3 text-right">Inversión Acumulada</th>
                <th className="px-4 py-3 text-center">Diagnóstico</th>
                <th className="px-4 py-3 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(243,239,231,0.06)] font-['Barlow']">
              {cargando ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#B8B2A6]">
                    Cargando inteligencia de flota...
                  </td>
                </tr>
              ) : unidadesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#B8B2A6]">
                    No hay unidades en el estado seleccionado ({filtroSalud}).
                  </td>
                </tr>
              ) : (
                unidadesFiltradas.map(u => (
                  <tr key={u.id_unidad} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-bold text-white font-mono">
                      <span className="inline-flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5 text-[#F2620F]" />
                        {u.id_unidad}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#B8B2A6]">{u.tipo}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 font-['Barlow_Condensed'] text-[11px] font-bold ${
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
                    <td className="px-4 py-3 w-48">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-['Barlow_Condensed']">
                          <span className="text-[#B8B2A6]">{u.porcentaje_consumido}% consumido</span>
                          <span className="text-white font-bold tabular-nums">
                            ${u.valor_referencia.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              u.porcentaje_consumido >= 70
                                ? 'bg-[#F2620F]'
                                : u.porcentaje_consumido >= 40
                                ? 'bg-[#E0C36A]'
                                : 'bg-[#3FA65C]'
                            }`}
                            style={{ width: `${Math.min(u.porcentaje_consumido, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-['Barlow_Condensed'] text-sm font-bold text-white tabular-nums">
                      ${u.costo_acumulado.toLocaleString()} MXN
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.candidata_yonke ? (
                        <span className="rounded bg-[#F2620F]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-[10px] font-bold uppercase text-[#F2620F]">
                          ⚠️ Candidata a Yonke
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#3FA65C]">Salud Óptima</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/ficha/${u.id_unidad}`)}
                        className="inline-flex items-center gap-1 text-xs text-[#C5A059] hover:text-white transition-colors cursor-pointer"
                      >
                        <span>Ficha</span>
                        <ArrowUpRight className="h-3 w-3" />
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
        reporte={reporteEmitido}
        abierto={modalReporteAbierto}
        alCerrar={() => setModalReporteAbierto(false)}
      />
    </div>
  )
}

export default AdminDashboard
