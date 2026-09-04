import React from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { useUiStore, type ToastNotificacion } from '../../store/useUiStore'

export const ToastContainer: React.FC = () => {
  const { toasts, removerToast } = useUiStore()

  if (toasts.length === 0) return null

  const getIcono = (tipo: ToastNotificacion['tipo']) => {
    switch (tipo) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-[#3FA65C] shrink-0" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-[#E0C36A] shrink-0" />
      case 'error':
        return <XCircle className="h-5 w-5 text-[#F2620F] shrink-0" />
      default:
        return <Info className="h-5 w-5 text-[#C5A059] shrink-0" />
    }
  }

  const getBorde = (tipo: ToastNotificacion['tipo']) => {
    switch (tipo) {
      case 'success':
        return 'border-[#3FA65C]/40 bg-[#14181D]/95'
      case 'warning':
        return 'border-[#E0C36A]/40 bg-[#14181D]/95'
      case 'error':
        return 'border-[#F2620F]/40 bg-[#14181D]/95'
      default:
        return 'border-[#C5A059]/40 bg-[#14181D]/95'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2.5 sm:bottom-6 sm:right-6">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-xl border p-3.5 shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 ${getBorde(
            toast.tipo
          )}`}
        >
          {getIcono(toast.tipo)}
          <div className="flex-1 min-w-0">
            {toast.titulo && (
              <h5 className="font-['Barlow_Condensed'] text-sm font-bold tracking-wide text-white">
                {toast.titulo}
              </h5>
            )}
            <p className="text-xs text-[#B8B2A6] leading-relaxed mt-0.5">
              {toast.mensaje}
            </p>
          </div>
          <button
            type="button"
            onClick={() => removerToast(toast.id)}
            className="text-[#B8B2A6] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
