import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router'
import { 
  Wifi, 
  WifiOff, 
  Maximize2, 
  Minimize2, 
  LogOut, 
  Home, 
  HardDrive,
  Truck
} from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { useUiStore } from '../../store/useUiStore'
import { ToastContainer } from '../layout/ToastContainer'
import logoWarhorse from '../../assets/logo.png'

export const PatioKioskLayout: React.FC = () => {
  const { usuario, token, cerrarSesion } = useAuthStore()
  const { isOnline, agregarToast } = useUiStore()
  const navigate = useNavigate()
  const location = useLocation()

  const [isFullscreen, setIsFullscreen] = useState(false)

  // Sincronizar estado de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Si no hay sesión, volver al login
  useEffect(() => {
    if (!token && !usuario) {
      navigate('/login', { replace: true })
    }
  }, [token, usuario, navigate])

  const alternarPantallaCompleta = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        agregarToast({
          tipo: 'info',
          titulo: 'Modo Kiosk Activado',
          mensaje: 'Visualización optimizada para tableta de patio.',
        })
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
      }
    } catch {
      // Fullscreen bloqueado o no soportado por políticas del navegador
    }
  }

  const manejarSalida = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch {
        // Ignorar
      }
    }
    cerrarSesion()
    navigate('/login')
  }

  if (!token && !usuario) {
    return null
  }

  const esVistaHome = location.pathname === '/patio'

  return (
    <div className="flex min-h-screen flex-col bg-[#0b0c0e] text-[#f3f4f6] select-none">
      {/* Barra de Estado Industrial de Tableta (Kiosk Shell) */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[rgba(243,239,231,0.12)] bg-[#12161B]/95 px-4 py-3 backdrop-blur-md sm:px-6">
        {/* Lado Izquierdo: Logo y Rol de Tableta */}
        <div className="flex items-center gap-3">
          <img 
            src={logoWarhorse} 
            alt="Warhorse" 
            className="h-8 w-auto brightness-0 invert object-contain" 
          />
          <div className="hidden sm:block border-l border-[rgba(243,239,231,0.15)] pl-3">
            <div className="flex items-center gap-2">
              <span className="font-['Barlow_Condensed'] text-base font-black tracking-wider text-white">
                PATIO WARHORSE
              </span>
              <span className="rounded bg-[#F2620F] px-1.5 py-0.2 font-['Barlow_Condensed'] text-[10px] font-black uppercase text-[#16191E]">
                KIOSK TABLET
              </span>
            </div>
            <p className="text-[10px] text-[#B8B2A6] font-['Barlow_Condensed'] uppercase tracking-wider">
              Terminal de Inspección de Piso
            </p>
          </div>
        </div>

        {/* Centro: Estatus del Operador y Unidad Asignada */}
        <div className="flex items-center gap-2 rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#181D23] px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C5A059]/20 text-[#C5A059]">
            <Truck className="h-4 w-4" />
          </div>
          <div className="text-left">
            <div className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-white">
              {usuario?.nombre || 'Operador en Patio'} ({usuario?.numeroEmpleado || 'EMP-409'})
            </div>
            <div className="text-[10px] text-[#C5A059]">
              Unidad Activa: <span className="font-bold">{usuario?.unidadAsignada || 'WH-101'}</span>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Conectividad, Pantalla Completa y Salida */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Badge de Red / Offline-First IndexedDB */}
          <div 
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-['Barlow_Condensed'] uppercase tracking-wider font-semibold ${
              isOnline 
                ? 'border-[#3FA65C]/30 bg-[#3FA65C]/10 text-[#3FA65C]' 
                : 'border-[#F2620F]/40 bg-[#F2620F]/15 text-[#F2620F]'
            }`}
            title={isOnline ? 'Conexión a servidor activa' : 'Operando con almacenamiento local IndexedDB'}
          >
            {isOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Offline (IndexDB)</span>
              </>
            )}
          </div>

          {/* Botón de Inicio si no está en Home */}
          {!esVistaHome && (
            <button
              type="button"
              onClick={() => navigate('/patio')}
              className="flex h-10 items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.12)] bg-[#181D23] px-3 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-white hover:border-[#C5A059] transition-all cursor-pointer"
            >
              <Home className="h-4 w-4 text-[#C5A059]" />
              <span className="hidden sm:inline">Menú Patio</span>
            </button>
          )}

          {/* Botón de Pantalla Completa (Fullscreen API) */}
          <button
            type="button"
            onClick={alternarPantallaCompleta}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#181D23] text-[#f3f4f6] hover:border-[#F2620F] hover:text-[#F2620F] transition-all cursor-pointer"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Activar pantalla completa para tableta'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>

          {/* Botón de Salir de Turno */}
          <button
            type="button"
            onClick={manejarSalida}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#181D23] px-3 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#B8B2A6] hover:border-[#c53030] hover:text-[#f87171] transition-all cursor-pointer"
            title="Finalizar turno de operador"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline">Cerrar Turno</span>
          </button>
        </div>
      </header>

      {/* Área de Trabajo de Tableta (Optimizada para pantalla completa de iPad Pro 10-11") */}
      <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <Outlet />
        </div>
      </main>

      {/* Barra de pie Kiosk para Tableta */}
      <footer className="border-t border-[rgba(243,239,231,0.08)] bg-[#0d1013] px-6 py-2.5 text-center text-xs text-[#B8B2A6]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HardDrive className="h-3.5 w-3.5 text-[#3FA65C]" />
            <span>Persistencia Local: <strong className="text-white">IndexedDB Warhorse</strong> activa</span>
          </div>
          <div className="font-mono text-[11px] text-[#C5A059]">
            DISPOSITIVO: TABLETA PATIO MANIOBRAS · BUILD V1.2-KIOSK
          </div>
        </div>
      </footer>

      {/* Contenedor de Notificaciones Toasts Táctiles */}
      <ToastContainer />
    </div>
  )
}

export default PatioKioskLayout
