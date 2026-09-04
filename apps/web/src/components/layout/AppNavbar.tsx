import React from 'react'
import { 
  Menu, 
  Wifi, 
  WifiOff, 
  LogOut, 
   
   
   
   
  Sun, 
  Moon,
  
} from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { useUiStore } from '../../store/useUiStore'
import logoWarhorse from '../../assets/Logo.png'

export const AppNavbar: React.FC = () => {
  const { usuario, cerrarSesion,  } = useAuthStore()
  const { 
    sidebarAbierto, 
    toggleSidebar, 
    tema, 
    setTema, 
    isOnline,
    agregarToast 
  } = useUiStore()


  // Escuchar cambios de conectividad
  React.useEffect(() => {
    const handleOnline = () => {
      useUiStore.getState().setIsOnline(true)
      agregarToast({
        tipo: 'success',
        titulo: 'Conexión Restablecida',
        mensaje: 'El sistema está en línea. Los datos locales se sincronizarán con el servidor.',
      })
    }
    const handleOffline = () => {
      useUiStore.getState().setIsOnline(false)
      agregarToast({
        tipo: 'warning',
        titulo: 'Modo Fuera de Línea',
        mensaje: 'Sin conexión de red. La persistencia local en IndexDB mantendrá sus capturas seguras.',
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [agregarToast])



  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[rgba(243,239,231,0.12)] bg-[#14181D]/90 px-4 backdrop-blur-md transition-colors sm:px-6">
      {/* Izquierda: Botón Menú + Identidad */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(243,239,231,0.15)] text-[#f3f4f6] transition-all hover:border-[#F2620F] hover:bg-[#F2620F]/10 hover:text-[#F2620F]"
          title={sidebarAbierto ? 'Ocultar barra lateral' : 'Mostrar barra lateral'}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <img 
            src={logoWarhorse} 
            alt="Warhorse" 
            className="h-9 w-auto object-contain brightness-0 invert" 
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Barlow_Condensed'] text-xl font-bold tracking-wider text-white">
                WARHORSE
              </span>
              <span className="hidden rounded bg-[#C5A059]/20 px-1.5 py-0.5 font-['Barlow_Condensed'] text-[11px] font-semibold uppercase tracking-wider text-[#C5A059] sm:inline-block">
                MÉXICO
              </span>
            </div>
            <p className="hidden text-[10px] tracking-tight text-[#B8B2A6] md:block">
              SISTEMA OPERATIVO DE TRANSPORTE Y TALLER
            </p>
          </div>
        </div>
      </div>

      {/* Centro / Derecha: Estado de Conectividad + Switch Rol + Usuario */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Indicador de Red (Online / Offline) */}
        <div 
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
            isOnline 
              ? 'bg-[#3FA65C]/15 text-[#3FA65C] border border-[#3FA65C]/30' 
              : 'bg-[#B4430A]/20 text-[#F2620F] border border-[#F2620F]/40 animate-pulse'
          }`}
          title={isOnline ? 'Conectado a servidor local' : 'Sin conexión. Modo Offline activo'}
        >
          {isOnline ? (
            <>
              <span className="h-2 w-2 rounded-full bg-[#3FA65C] animate-ping" />
              <Wifi className="h-3.5 w-3.5" />
              <span className="hidden sm:inline font-['Barlow_Condensed'] uppercase tracking-wider">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5" />
              <span className="font-['Barlow_Condensed'] uppercase tracking-wider">Modo Patio Offline</span>
            </>
          )}
        </div>



        {/* Selector de Tema */}
        <button
          type="button"
          onClick={() => setTema(tema === 'dark' ? 'light' : 'dark')}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(243,239,231,0.15)] text-[#f3f4f6] transition-all hover:bg-white/10"
          title={`Cambiar a modo ${tema === 'dark' ? 'claro' : 'oscuro'}`}
        >
          {tema === 'dark' ? <Sun className="h-4 w-4 text-[#E0C36A]" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Perfil del Usuario & Logout */}
        <div className="flex items-center gap-2 border-l border-[rgba(243,239,231,0.15)] pl-3">
          <div className="hidden text-right sm:block">
            <div className="max-w-[140px] truncate text-xs font-semibold text-[#f3f4f6]">
              {usuario?.nombre || 'Usuario'}
            </div>
            <div className="text-[10px] uppercase font-['Barlow_Condensed'] tracking-wider text-[#B8B2A6]">
              {usuario?.numeroEmpleado ? `ID: ${usuario.numeroEmpleado}` : usuario?.rol}
            </div>
          </div>

          <button
            type="button"
            onClick={cerrarSesion}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[#B8B2A6] transition-all hover:border-[#B4430A]/40 hover:bg-[#B4430A]/20 hover:text-[#F2620F]"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
