import React, { useState, useEffect, useRef } from 'react'
import { 
  Camera, 
  X, 
  RefreshCw, 
  CheckCircle2, 
  Volume2, 
  Sparkles
} from 'lucide-react'

interface QrScannerModalProps {
  abierto: boolean
  onCerrar: () => void
  onScanSuccess: (datos: {
    idEmpleado: string
    nombre?: string
    unidad?: string
    licencia?: string
    tipoOperacion?: string
  }) => void
}

// Gafetes de prueba preconfigurados con datos de la flota Warhorse
const GAFETES_PRECARGADOS = [
  {
    idEmpleado: 'EMP-409',
    nombre: 'Juan Morales',
    unidad: 'WH-101',
    licencia: 'LIC-CHIH-98842',
    tipoOperacion: 'Cruce',
    foto: '👨‍✈️',
  },
  {
    idEmpleado: 'EMP-512',
    nombre: 'Carlos Estrada',
    unidad: 'WH-104',
    licencia: 'LIC-SON-44120',
    tipoOperacion: 'Foráneo',
    foto: '👨‍🔧',
  },
  {
    idEmpleado: 'EMP-308',
    nombre: 'Raúl Domínguez',
    unidad: 'WH-125',
    licencia: 'LIC-NL-88190',
    tipoOperacion: 'Local',
    foto: '🚛',
  },
  {
    idEmpleado: 'EMP-701',
    nombre: 'Martín Delgado',
    unidad: 'CJ-502',
    licencia: 'LIC-CHIH-77112',
    tipoOperacion: 'Backup',
    foto: '📦',
  },
]

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  abierto,
  onCerrar,
  onScanSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [camaraActiva, setCamaraActiva] = useState(false)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [errorCamara, setErrorCamara] = useState<string | null>(null)
  const [escaneando, setEscaneando] = useState(false)
  const [gafeteDetectado, setGafeteDetectado] = useState<string | null>(null)

  // Reproducir sonido "beep" industrial mediante Web Audio API
  const emitirBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(1760, ctx.currentTime) // Tono A6 (agudo, tipo escáner Zebra)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.12)
    } catch {
      // Audio no permitido o silenciado
    }
  }

  // Iniciar flujo de video
  useEffect(() => {
    if (!abierto) {
      detenerCamara()
      return
    }

    iniciarCamara()

    return () => {
      detenerCamara()
    }
  }, [abierto, facingMode])

  const iniciarCamara = async () => {
    setErrorCamara(null)
    setEscaneando(true)

    try {
      detenerCamara()
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La API de cámara no está disponible en este entorno.')
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
      setCamaraActiva(true)
    } catch (err) {
      console.warn('Cámara física no disponible, activando modo simulación:', err)
      setErrorCamara(
        'Cámara no detectada o permisos denegados. Puedes usar el simulador de gafetes de alta velocidad aquí abajo.'
      )
      setCamaraActiva(false)
    }
  }

  const detenerCamara = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setCamaraActiva(false)
  }

  const alternarCamara = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'))
  }

  const procesarGafete = (gafete: typeof GAFETES_PRECARGADOS[0]) => {
    emitirBeep()
    setGafeteDetectado(gafete.idEmpleado)

    setTimeout(() => {
      onScanSuccess({
        idEmpleado: gafete.idEmpleado,
        nombre: gafete.nombre,
        unidad: gafete.unidad,
        licencia: gafete.licencia,
        tipoOperacion: gafete.tipoOperacion,
      })
      onCerrar()
      setGafeteDetectado(null)
    }, 450)
  }

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] shadow-2xl">
        {/* Cabecera del Escáner */}
        <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] bg-[#0f0f10] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F2620F]/20 text-[#F2620F]">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-['Barlow_Condensed'] text-xl font-bold uppercase tracking-wider text-white">
                Escáner QR de Gafete y Unidad
              </h3>
              <p className="text-[11px] text-[#B8B2A6]">
                Apunta la cámara de la tableta al código QR del operador o tracto
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full p-2 text-[#B8B2A6] hover:bg-[#1C1C1C] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Visor de Cámara con Retícula Industrial */}
        <div className="relative aspect-4/3 w-full overflow-hidden bg-black flex items-center justify-center">
          {camaraActiva ? (
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="relative mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C]">
                <Camera className="h-8 w-8 text-[#B8B2A6]" />
                <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-[#F2620F]/40 animate-pulse" />
              </div>
              <p className="text-xs text-[#B8B2A6] max-w-xs">
                {errorCamara || 'Inicializando sensor óptico...'}
              </p>
            </div>
          )}

          {/* Retícula HUD Industrial (Esquinas en color de marca) */}
          <div className="pointer-events-none absolute inset-8 flex flex-col justify-between">
            <div className="flex justify-between">
              <div className="h-8 w-8 border-t-4 border-l-4 border-[#F2620F] rounded-tl-lg" />
              <div className="h-8 w-8 border-t-4 border-r-4 border-[#F2620F] rounded-tr-lg" />
            </div>

            {/* Haz Láser Animado de Escaneo */}
            {escaneando && !gafeteDetectado && (
              <div className="relative flex items-center justify-center">
                <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#F2620F] to-transparent shadow-[0_0_12px_#F2620F] animate-pulse" />
              </div>
            )}

            {/* Alerta de Detección Exitosa */}
            {gafeteDetectado && (
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2 rounded-xl border border-[#3FA65C] bg-[#3FA65C]/90 px-4 py-2 text-white font-['Barlow_Condensed'] text-lg font-bold uppercase tracking-wider shadow-lg shadow-[#3FA65C]/30 animate-bounce">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>¡Código QR Verificado: {gafeteDetectado}!</span>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <div className="h-8 w-8 border-b-4 border-l-4 border-[#F2620F] rounded-bl-lg" />
              <div className="h-8 w-8 border-b-4 border-r-4 border-[#F2620F] rounded-br-lg" />
            </div>
          </div>

          {/* Botón Flotante para Alternar Cámara Trasera / Frontal */}
          {camaraActiva && (
            <button
              type="button"
              onClick={alternarCamara}
              className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-md hover:bg-black/80 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Girar Cámara</span>
            </button>
          )}
        </div>

        {/* Barra de Acciones y Simulador de Gafetes Físicos */}
        <div className="bg-[#0f0f10] p-4 sm:p-5 border-t border-[rgba(243,239,231,0.08)]">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#C5A059] font-['Barlow_Condensed']">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Gafetes Registrados en Patio (Simulador de 1-Toque)</span>
            </div>
            <span className="text-[10px] text-[#B8B2A6]">
              Simula el escaneo físico instantáneo
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {GAFETES_PRECARGADOS.map(g => (
              <button
                key={g.idEmpleado}
                type="button"
                onClick={() => procesarGafete(g)}
                className="group relative flex flex-col items-start rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#14181D] p-2.5 text-left transition-all hover:border-[#F2620F] hover:bg-[#1C1C1C] cursor-pointer"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-['Barlow_Condensed'] text-sm font-bold text-white group-hover:text-[#F2620F]">
                    {g.idEmpleado}
                  </span>
                  <span className="rounded bg-[#F2620F]/15 px-1.5 py-0.5 font-['Barlow_Condensed'] text-[10px] font-bold text-[#F2620F]">
                    {g.unidad}
                  </span>
                </div>
                <div className="mt-1 text-xs text-[#f3f4f6] truncate w-full">
                  {g.nombre}
                </div>
                <div className="text-[10px] text-[#B8B2A6]">
                  {g.tipoOperacion} · {g.licencia}
                </div>
              </button>
            ))}
          </div>

          {/* Advertencia / Ayuda */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#B8B2A6]">
            <div className="flex items-center gap-1">
              <Volume2 className="h-3 w-3 text-[#3FA65C]" />
              <span>Feedback sonoro activo (Beep industrial)</span>
            </div>
            <button
              type="button"
              onClick={onCerrar}
              className="text-[#F2620F] hover:underline font-semibold"
            >
              Capturar ID Manualmente
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
