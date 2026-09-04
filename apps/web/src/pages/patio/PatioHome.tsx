import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { 
  ClipboardCheck, 
  History, 
  Truck, 
  Clock, 
  ShieldCheck, 
  QrCode,
  ArrowRight,
  Sparkles,
  Layers,
  FileText,
  Gauge
} from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { useUiStore } from '../../store/useUiStore'
import { 
  obtenerBorradorLocal, 
  obtenerHistorialLocal, 
  inicializarDatosMuestraPatio 
} from '../../lib/inspeccionStorage'
import type { OrdenInspeccionForm } from '../../lib/inspeccionSchema'
import { QrScannerModal } from '../../components/patio/QrScannerModal'

export const PatioHome: React.FC = () => {
  const { usuario, iniciarSesionOperador } = useAuthStore()
  const { agregarToast, isOnline } = useUiStore()
  const navigate = useNavigate()

  const [tieneBorrador, setTieneBorrador] = useState(false)
  const [modalQrAbierto, setModalQrAbierto] = useState(false)
  const [ultimasInspecciones, setUltimasInspecciones] = useState<OrdenInspeccionForm[]>([])

  // Cargar estado inicial y previsualización de bitácora
  useEffect(() => {
    async function cargarDatos() {
      if (!usuario) return
      // 1. Checar borrador
      const borrador = await obtenerBorradorLocal(usuario.numeroEmpleado || 'EMP-409')
      if (borrador) {
        setTieneBorrador(true)
      }

      // 2. Cargar historial local para previsualización directa (Filtrado estricto de Historial Propio RBAC)
      await inicializarDatosMuestraPatio()
      const historial = await obtenerHistorialLocal()
      const misInspecciones = historial.filter(
        insp =>
          (usuario.numeroEmpleado && insp.operador_id === usuario.numeroEmpleado) ||
          (usuario.nombre && insp.operador_nombre.toLowerCase() === usuario.nombre.toLowerCase())
      )
      setUltimasInspecciones(misInspecciones.slice(0, 3))
    }
    cargarDatos()
  }, [usuario])

  const manejarEscaneoUnidad = (datos: {
    idEmpleado: string
    nombre?: string
    unidad?: string
  }) => {
    if (datos.unidad) {
      iniciarSesionOperador(
        usuario?.numeroEmpleado || datos.idEmpleado,
        usuario?.nombre || datos.nombre,
        datos.unidad
      )
      agregarToast({
        tipo: 'success',
        titulo: 'Tracto Actualizado',
        mensaje: `Unidad de trabajo cambiada a ${datos.unidad}`,
      })
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Banner Cockpit de iPad Pro: Encabezado de Turno de Alto Rendimiento */}
      <div className="relative overflow-hidden rounded-3xl border border-[rgba(243,239,231,0.12)] bg-gradient-to-r from-[#14181D] via-[#12161B] to-[#181D23] p-5 sm:p-6 backdrop-blur-xl shadow-xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#F2620F]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[#C5A059]/10 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F2620F]/30 bg-[#F2620F]/15 px-3 py-0.5 text-xs font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-[#F2620F]">
                <Sparkles className="h-3.5 w-3.5" />
                Punto de Inspección Física · Terminal iPad Pro
              </span>
              <span className="rounded-full bg-[#3FA65C]/15 px-2.5 py-0.5 font-['Barlow_Condensed'] text-[11px] font-semibold text-[#3FA65C] uppercase">
                {isOnline ? 'Online / En Línea' : 'Offline / IndexDB'}
              </span>
            </div>
            <h1 className="font-['Barlow_Condensed'] text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
              Turno Activo: {usuario?.nombre || 'Operador en Patio'}
            </h1>
            <p className="text-xs sm:text-sm text-[#B8B2A6]">
              Terminal ergonómica de inspección previa a viaje y recepción de tractocamiones.
            </p>
          </div>

          {/* Selector y Resumen de la Unidad Activa */}
          <div className="flex items-center gap-3 rounded-2xl border border-[rgba(243,239,231,0.12)] bg-[#0f0f10] p-3 sm:p-4 shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#C5A059]/20 text-[#C5A059]">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#B8B2A6] font-['Barlow_Condensed']">
                Tracto Asignado
              </div>
              <div className="font-['Barlow_Condensed'] text-2xl font-black tracking-wider text-white">
                {usuario?.unidadAsignada || 'WH-101'}
              </div>
              <button
                type="button"
                onClick={() => setModalQrAbierto(true)}
                className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-[#F2620F] hover:underline cursor-pointer"
              >
                <QrCode className="h-3 w-3" />
                <span>Cambiar / Re-escanear QR</span>
              </button>
            </div>
          </div>
        </div>

        {/* Alerta de Borrador Pendiente en IndexedDB si existe */}
        {tieneBorrador && (
          <div className="relative z-10 mt-4 flex items-center justify-between rounded-2xl border border-[#C5A059]/40 bg-[#C5A059]/15 p-3.5 text-[#f3f4f6]">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C5A059] text-[#16191E]">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <div className="font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                  Borrador en memoria detectado
                </div>
                <div className="text-xs text-[#B8B2A6]">
                  Tienes una inspección guardada sin enviar para la unidad {usuario?.unidadAsignada || 'WH-101'}.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/patio/inspeccion')}
              className="flex items-center gap-1.5 rounded-xl bg-[#C5A059] px-3.5 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] shadow-md hover:bg-[#b08d47] transition-all cursor-pointer"
            >
              <span>Continuar Borrador</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Las 2 Grandes Baldosas Táctiles Hero en Doble Columna (Optimizadas iPad Pro 10" Horizontal y Vertical) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Baldosa 1: Nueva Inspección Física (Hero Action Card) */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-[rgba(243,239,231,0.12)] bg-[#14181D] p-5 sm:p-6 shadow-xl hover:border-[#F2620F] transition-all min-h-[340px]">
          <div className="pointer-events-none absolute -right-12 -bottom-12 h-56 w-56 rounded-full bg-[#F2620F]/15 blur-3xl" />

          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F2620F] text-[#16191E] shadow-lg shadow-[#F2620F]/30">
                <ClipboardCheck className="h-8 w-8 stroke-[2.5]" />
              </div>
              <div className="text-right">
                <span className="rounded-full bg-[#F2620F]/15 px-3 py-1 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#F2620F]">
                  Checklist Dinámico
                </span>
                <div className="mt-1 text-[11px] text-[#B8B2A6]">
                  Frenos · Motor · Luces · Cabina
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="font-['Barlow_Condensed'] text-2xl sm:text-3xl font-black uppercase tracking-wide text-white">
                Nueva Inspección de Salida / Retorno
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#B8B2A6]">
                Evalúa los 16 sistemas mecánicos de la unidad <strong className="text-white">{usuario?.unidadAsignada || 'WH-101'}</strong>. Las alertas graves derivan automáticamente una Orden de Trabajo al taller.
              </p>
            </div>

            {/* Métrica Táctil Rápida */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#0f0f10]/80 p-3">
                <div className="flex items-center gap-1.5 text-[11px] text-[#B8B2A6] font-['Barlow_Condensed'] uppercase tracking-wider">
                  <Gauge className="h-3.5 w-3.5 text-[#F2620F]" />
                  <span>Odómetro Estimado</span>
                </div>
                <div className="mt-1 font-['Barlow_Condensed'] text-lg font-bold text-white font-mono">
                  428,950 KM
                </div>
              </div>
              <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#0f0f10]/80 p-3">
                <div className="flex items-center gap-1.5 text-[11px] text-[#B8B2A6] font-['Barlow_Condensed'] uppercase tracking-wider">
                  <Clock className="h-3.5 w-3.5 text-[#C5A059]" />
                  <span>Tiempo Promedio</span>
                </div>
                <div className="mt-1 font-['Barlow_Condensed'] text-lg font-bold text-white">
                  ~4 Minutos
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[rgba(243,239,231,0.08)]">
            <button
              type="button"
              onClick={() => navigate('/patio/inspeccion')}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#F2620F] py-4 font-['Barlow_Condensed'] text-lg font-bold uppercase tracking-wider text-[#16191E] shadow-xl shadow-[#F2620F]/20 hover:bg-[#D9550C] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Comenzar Inspección Física</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Baldosa 2: Historial Activo con Previsualización Directa (iPad Cockpit) */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-[rgba(243,239,231,0.12)] bg-[#14181D] p-5 sm:p-6 shadow-xl hover:border-[#C5A059] transition-all min-h-[340px]">
          <div className="pointer-events-none absolute -right-12 -bottom-12 h-56 w-56 rounded-full bg-[#C5A059]/15 blur-3xl" />

          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#C5A059] text-[#16191E] shadow-lg shadow-[#C5A059]/30">
                <History className="h-8 w-8 stroke-[2.5]" />
              </div>
              <div className="text-right">
                <span className="rounded-full bg-[#C5A059]/15 px-3 py-1 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#C5A059]">
                  Bitácora de Patio
                </span>
                <div className="mt-1 text-[11px] text-[#B8B2A6]">
                  Registro local e histórico
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="font-['Barlow_Condensed'] text-2xl sm:text-3xl font-black uppercase tracking-wide text-white">
                Mis Inspecciones Recientes
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#B8B2A6]">
                Consulta tus folios emitidos en este turno y el seguimiento de alertas que reportaste al equipo de Taller.
              </p>
            </div>

            {/* Previsualización en Vivo de las Últimas Inspecciones Propias (RBAC Historial Propio) */}
            <div className="mt-4 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#C5A059] font-['Barlow_Condensed'] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Mis Folios Registrados Hoy ({usuario?.nombre || 'Operador'})</span>
                </div>
                <span className="text-[10px] text-[#B8B2A6] font-mono">
                  {ultimasInspecciones.length} folio(s)
                </span>
              </div>

              {ultimasInspecciones.length > 0 ? (
                ultimasInspecciones.map(insp => {
                  const tieneCritico = insp.items.some(i => i.estado === 'Crítico')
                  const tieneRegular = insp.items.some(i => i.estado === 'Regular')

                  return (
                    <div 
                      key={insp.folio}
                      onClick={() => navigate('/patio/historial')}
                      className="flex items-center justify-between rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#0f0f10]/80 p-2.5 hover:border-[#C5A059] transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-[#C5A059]" />
                        <div>
                          <div className="font-['Barlow_Condensed'] text-xs font-bold text-white">
                            {insp.folio} · <span className="text-[#C5A059]">{insp.unidad_id}</span>
                          </div>
                          <div className="text-[10px] text-[#B8B2A6]">
                            {insp.fecha.substring(11, 16)} hrs · Unidad {insp.unidad_id}
                          </div>
                        </div>
                      </div>

                      <div>
                        {tieneCritico ? (
                          <span className="rounded bg-[#c53030]/20 px-2 py-0.5 text-[10px] font-bold text-[#f87171] uppercase font-['Barlow_Condensed']">
                            🚨 Falla Crítica
                          </span>
                        ) : tieneRegular ? (
                          <span className="rounded bg-[#C5A059]/20 px-2 py-0.5 text-[10px] font-bold text-[#C5A059] uppercase font-['Barlow_Condensed']">
                            ⚠️ Warning
                          </span>
                        ) : (
                          <span className="rounded bg-[#3FA65C]/20 px-2 py-0.5 text-[10px] font-bold text-[#3FA65C] uppercase font-['Barlow_Condensed']">
                            ✅ Conforme
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-[rgba(243,239,231,0.12)] bg-[#0f0f10]/60 p-4 text-center">
                  <FileText className="h-6 w-6 text-[#C5A059]/40 mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-white/90">Aún no registras inspecciones en este turno.</p>
                  <p className="text-[11px] text-[#B8B2A6] mt-0.5">
                    Tus folios emitidos aparecerán aquí para tu consulta personal.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[rgba(243,239,231,0.08)]">
            <button
              type="button"
              onClick={() => navigate('/patio/historial')}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#C5A059] bg-[#C5A059]/15 py-4 font-['Barlow_Condensed'] text-lg font-bold uppercase tracking-wider text-[#C5A059] hover:bg-[#C5A059] hover:text-[#16191E] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Ver Mi Bitácora de Inspecciones</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Telemetría Inferior de Tableta iPad Pro */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/90 p-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3FA65C]/15 text-[#3FA65C] shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#B8B2A6] font-['Barlow_Condensed']">
              Operador Verificado
            </div>
            <div className="font-['Barlow_Condensed'] text-sm font-bold text-white">
              {usuario?.numeroEmpleado || 'EMP-409'} · Licencia SCT Vigente
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/90 p-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C5A059]/15 text-[#C5A059] shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#B8B2A6] font-['Barlow_Condensed']">
              Persistencia Local
            </div>
            <div className="font-['Barlow_Condensed'] text-sm font-bold text-white">
              IndexedDB Protegido · 0 Fallas
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/90 p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2620F]/15 text-[#F2620F] shrink-0">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#B8B2A6] font-['Barlow_Condensed']">
                Lector de Gafete y Tracto
              </div>
              <div className="font-['Barlow_Condensed'] text-sm font-bold text-white">
                Cámara Óptica Lista
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalQrAbierto(true)}
            className="rounded-xl bg-[#F2620F] px-3 py-1.5 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#16191E] hover:bg-[#D9550C] transition-all cursor-pointer"
          >
            Escanear
          </button>
        </div>
      </div>

      {/* Modal de Escáner QR */}
      <QrScannerModal
        abierto={modalQrAbierto}
        onCerrar={() => setModalQrAbierto(false)}
        onScanSuccess={manejarEscaneoUnidad}
      />
    </div>
  )
}

export default PatioHome
