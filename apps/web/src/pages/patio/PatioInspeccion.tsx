import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Wifi, 
  Save, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  RotateCcw,
  Send,
  Home,
  Truck,
  Gauge,
  Fuel,
  Camera,
  Eraser,
  PenTool,
  X,
  Plus,
  Filter,
  Check,
  Upload
} from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { useUiStore } from '../../store/useUiStore'
import { 
  ordenInspeccionSchema, 
  type OrdenInspeccionForm, 
  SISTEMAS_INSPECCION_DEFAULT 
} from '../../lib/inspeccionSchema'
import { 
  guardarBorradorLocal, 
  obtenerBorradorLocal, 
  eliminarBorradorLocal, 
  guardarInspeccionFinalizada 
} from '../../lib/inspeccionStorage'
import { OrdenInspeccionModal } from '../../components/patio/OrdenInspeccionModal'

const NIVELES_COMBUSTIBLE = ['Reserva', '1/4', '1/2', '3/4', 'Lleno'] as const
const TIPOS_OPERACION = ['Cruce', 'Foráneo', 'Local', 'Backup'] as const
const UNIDADES_FRECUENTES = ['WH-101', 'WH-104', 'WH-125', 'CJ-502', 'TH-201'] as const

const SISTEMAS_TABS = [
  'Todos',
  'Motor y Fluidos',
  'Frenos y Neumáticos',
  'Luces y Eléctrico',
  'Carrocería y Cabina',
  'Seguridad y Documentación'
] as const

const TAGS_FALLAS_COMUNES: Record<string, string[]> = {
  'mot_aceite': ['Nivel bajo de aceite', 'Aceite degradado / quemado', 'Fuga en tapón de cárter'],
  'mot_anticongelante': ['Nivel bajo en depósito', 'Fuga en manguera superior', 'Abrazadera floja'],
  'mot_fugas': ['Fuga visible de diésel', 'Goteo en conexiones hidráulicas', 'Empaque con rezumo'],
  'fre_balatas': ['Baja presión en llantas', 'Desgaste irregular de dibujo', 'Corte visible en banda'],
  'fre_aire': ['Fuga de aire en manita roja', 'Manguera agrietada', 'Baja presión de sistema'],
  'fre_freno': ['Pedal esponjoso', 'Freno de estacionamiento no retiene', 'Respuesta retardada'],
  'luc_principales': ['Faro izquierdo fundido', 'Faro derecho sin altas', 'Mica estrellada'],
  'luc_stop': ['Luz de stop central fundida', 'Direccional izquierda no parpadea', 'Conector sulfatado'],
  'luc_gibo': ['Demarcadora superior apagada', 'Luz lateral rota'],
  'cab_espejos': ['Espejo cóncavo estrellado', 'Parabrisas con golpe de piedra'],
  'cab_limpiadores': ['Pluma limpiaparabrisas rota', 'Claxon no responde / bajo sonido'],
  'cab_quinta': ['Seguro de traba con holgura', 'Falta grasa en plato'],
  'seg_extintor': ['Extintor descargado / sin manómetro', 'Fecha de vigencia vencida'],
  'seg_documentos': ['Póliza por vencer en 7 días', 'Falta copia de tarjeta circulación'],
}

export const PatioInspeccion: React.FC = () => {
  const navigate = useNavigate()
  const { usuario } = useAuthStore()
  const { agregarToast, isOnline } = useUiStore()

  const [paso, setPaso] = useState<1 | 2 | 3>(1)
  const [ordenGenerada, setOrdenGenerada] = useState<OrdenInspeccionForm | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [hayBorrador, setHayBorrador] = useState(false)
  const [guardandoBorrador, setGuardandoBorrador] = useState(false)
  const [sistemaActivo, setSistemaActivo] = useState<string>('Todos')

  // Estado del lienzo de firma táctil para iPad
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [dibujando, setDibujando] = useState(false)
  const [tieneFirmaDigital, setTieneFirmaDigital] = useState(false)

  // Referencias a inputs de archivos para cámara fotográfica
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

  // Generar folio único correlativo
  const folioInicial = `INS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrdenInspeccionForm>({
    resolver: zodResolver(ordenInspeccionSchema),
    defaultValues: {
      folio: folioInicial,
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 19),
      operador_id: usuario?.numeroEmpleado || 'EMP-409',
      operador_nombre: usuario?.nombre || 'Juan Morales',
      licencia: 'LIC-CHIH-98842',
      unidad_id: usuario?.unidadAsignada || 'WH-101',
      tipo_operacion: 'Cruce',
      kilometraje: 428950,
      nivel_combustible: '3/4',
      items: SISTEMAS_INSPECCION_DEFAULT.map(item => ({
        ...item,
        estado: 'Bueno',
        observacion: '',
        foto_url: '',
      })),
      observaciones_generales: '',
      firma_digital: usuario?.nombre || 'Juan Morales',
      requiere_ot: false,
      sincronizado: false,
    },
    mode: 'onChange',
  })

  const { fields } = useFieldArray({
    control,
    name: 'items',
  })

  const formValores = watch()

  // Comprobar borrador al cargar
  useEffect(() => {
    async function checarBorrador() {
      if (!usuario) return
      const borrador = await obtenerBorradorLocal(usuario.numeroEmpleado || 'EMP-409')
      if (borrador) {
        setHayBorrador(true)
      }
    }
    checarBorrador()
  }, [usuario])

  // Cargar borrador previo
  const cargarBorrador = async () => {
    if (!usuario) return
    const borrador = await obtenerBorradorLocal(usuario.numeroEmpleado || 'EMP-409')
    if (borrador) {
      reset(borrador as OrdenInspeccionForm)
      setHayBorrador(false)
      agregarToast({
        tipo: 'info',
        titulo: 'Borrador Cargado',
        mensaje: 'Se restauraron los datos locales en la tableta.',
      })
    }
  }

  // Descartar borrador
  const descartarBorrador = async () => {
    if (!usuario) return
    await eliminarBorradorLocal(usuario.numeroEmpleado || 'EMP-409')
    setHayBorrador(false)
    agregarToast({
      tipo: 'warning',
      titulo: 'Borrador Descartado',
      mensaje: 'Iniciando inspección en blanco.',
    })
  }

  // Guardar borrador manual
  const guardarPasoBorrador = async () => {
    if (!usuario) return
    setGuardandoBorrador(true)
    try {
      await guardarBorradorLocal(usuario.numeroEmpleado || 'EMP-409', formValores)
      agregarToast({
        tipo: 'success',
        titulo: 'Borrador Guardado',
        mensaje: 'Los datos están protegidos en IndexedDB localmente.',
      })
    } finally {
      setGuardandoBorrador(false)
    }
  }

  // Acción rápida industrial: Marcar todos como conformes
  const marcarTodosComoConformes = () => {
    fields.forEach((_, idx) => {
      setValue(`items.${idx}.estado`, 'Bueno')
      setValue(`items.${idx}.observacion`, '')
    })
    agregarToast({
      tipo: 'success',
      titulo: 'Sistemas Conformes',
      mensaje: 'Todos los componentes marcados en estado Bueno (100%).',
    })
  }

  // Acción rápida industrial: Aprobar solo el sistema seleccionado
  const marcarSistemaConforme = (nombreSistema: string) => {
    fields.forEach((f, idx) => {
      if (f.sistema === nombreSistema) {
        setValue(`items.${idx}.estado`, 'Bueno')
        setValue(`items.${idx}.observacion`, '')
      }
    })
    agregarToast({
      tipo: 'success',
      titulo: `Sistema ${nombreSistema} Conforme`,
      mensaje: 'Componentes del sistema aprobados.',
    })
  }

  // Inserción de tag de falla rápida
  const aplicarFallaRapida = (idx: number, textoFalla: string) => {
    setValue(`items.${idx}.observacion`, textoFalla, { shouldValidate: true })
  }

  // Carga de foto real mediante input de archivo / cámara trasera
  const manejarCapturaFoto = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setValue(`items.${idx}.foto_url`, reader.result as string)
        agregarToast({
          tipo: 'info',
          titulo: 'Fotografía Capturada',
          mensaje: `Evidencia fotográfica adjuntada para ${formValores.items[idx]?.componente}.`,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  // Simulación de foto de evidencia de respaldo
  const adjuntarFotoEvidenciaMuestra = (idx: number) => {
    const fotosMuestra = [
      'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=400&q=80',
    ]
    const foto = fotosMuestra[idx % fotosMuestra.length]
    setValue(`items.${idx}.foto_url`, foto)
    agregarToast({
      tipo: 'info',
      titulo: 'Evidencia Adjunta',
      mensaje: `Foto registrada para ${formValores.items[idx]?.componente}.`,
    })
  }

  const removerFotoEvidencia = (idx: number) => {
    setValue(`items.${idx}.foto_url`, '')
    if (fileInputRefs.current[idx]) {
      fileInputRefs.current[idx]!.value = ''
    }
  }

  // Ajuste rápido de odómetro con steppers
  const ajustarOdometro = (delta: number) => {
    const actual = formValores.kilometraje || 0
    setValue('kilometraje', Math.max(0, actual + delta), { shouldValidate: true })
  }

  // Control del Lienzo de Firma Táctil para iPad Pro
  const obtenerCoordenadas = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const iniciarTrazo = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = obtenerCoordenadas(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setDibujando(true)
  }

  const dibujarTrazo = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!dibujando) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = obtenerCoordenadas(e)
    ctx.lineWidth = 3.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#F2620F'
    ctx.lineTo(x, y)
    ctx.stroke()
    setTieneFirmaDigital(true)
  }

  const finalizarTrazo = () => {
    setDibujando(false)
  }

  const limpiarFirma = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setTieneFirmaDigital(false)
  }

  // Envío final del cuestionario
  const alEnviar = async (datos: OrdenInspeccionForm) => {
    const tieneCritico = datos.items.some(i => i.estado === 'Crítico')
    const tieneRegular = datos.items.some(i => i.estado === 'Regular')
    const requiereOt = tieneCritico || tieneRegular

    const ordenCompleta: OrdenInspeccionForm = {
      ...datos,
      requiere_ot: requiereOt,
      sincronizado: isOnline,
    }

    // 1. Guardar en repositorio permanente IndexedDB
    await guardarInspeccionFinalizada(ordenCompleta)

    // 2. Limpiar borrador temporal
    if (usuario) {
      await eliminarBorradorLocal(usuario.numeroEmpleado || 'EMP-409')
    }

    // 3. Mostrar documento adjunto oficial
    setOrdenGenerada(ordenCompleta)
    setModalAbierto(true)

    agregarToast({
      tipo: 'success',
      titulo: 'Inspección Concluida',
      mensaje: `Folio ${ordenCompleta.folio} emitido con éxito. ${
        requiereOt ? 'Se disparó alerta al equipo de Taller.' : 'Unidad liberada 100% activa.'
      }`,
    })
  }

  // Filtrado de items por sistema en Paso 2
  const itemsFiltrados = fields.filter((f) => {
    if (sistemaActivo === 'Todos') return true
    return f.sistema === sistemaActivo
  })

  // Conteo de items por estado
  const conteoBueno = formValores.items?.filter(i => i.estado === 'Bueno').length || 0
  const conteoRegular = formValores.items?.filter(i => i.estado === 'Regular').length || 0
  const conteoCritico = formValores.items?.filter(i => i.estado === 'Crítico').length || 0

  return (
    <div className="space-y-4 sm:space-y-5 pb-12">
      {/* Encabezado Ergonómico del Módulo */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(243,239,231,0.1)] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#F2620F]/20 px-2.5 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#F2620F]">
              Paso {paso} de 3
            </span>
            <span className="rounded bg-[#3FA65C]/20 px-2.5 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#3FA65C] flex items-center gap-1">
              <Wifi className="h-3 w-3" /> {isOnline ? 'En Línea' : 'Offline / IndexDB'}
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-[#C5A059]">
              FOLIO: {formValores.folio}
            </span>
          </div>
          <h1 className="mt-1 font-['Barlow_Condensed'] text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-white">
            Inspección Física de Unidad
          </h1>
          <p className="text-xs text-[#B8B2A6]">
            Cuestionario oficial de patio para recepción y salida de vehículos pesados (Tablet Kiosk).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/patio')}
            className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3.5 py-2 text-xs font-semibold text-[#f3f4f6] hover:border-[#C5A059] hover:text-[#C5A059] transition-all cursor-pointer"
          >
            <Home className="h-4 w-4 text-[#C5A059]" />
            <span>Menú Patio</span>
          </button>
          <button
            type="button"
            onClick={guardarPasoBorrador}
            disabled={guardandoBorrador}
            className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3.5 py-2 text-xs font-semibold text-[#f3f4f6] hover:border-[#F2620F] hover:text-[#F2620F] transition-all cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{guardandoBorrador ? 'Guardando...' : 'Guardar Borrador'}</span>
          </button>
        </div>
      </div>

      {/* Alerta de Borrador Existente */}
      {hayBorrador && (
        <div className="flex items-center justify-between rounded-2xl border border-[#C5A059]/40 bg-[#C5A059]/15 p-3.5 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <RotateCcw className="h-5 w-5 text-[#C5A059] shrink-0" />
            <div>
              <div className="font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wide text-white">
                Borrador pendiente detectado
              </div>
              <div className="text-xs text-[#B8B2A6]">
                Tienes una inspección sin enviar guardada localmente en la memoria de esta tableta.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cargarBorrador}
              className="rounded-xl bg-[#C5A059] px-4 py-1.5 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#16191E] hover:bg-[#b08d48] transition-all cursor-pointer"
            >
              Reanudar
            </button>
            <button
              type="button"
              onClick={descartarBorrador}
              className="rounded-xl border border-[rgba(243,239,231,0.15)] px-3 py-1.5 text-xs text-[#B8B2A6] hover:text-white transition-all cursor-pointer"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {/* Indicador de Pasos del Wizard (Diseño Táctil de iPad Pro) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
        <div
          onClick={() => setPaso(1)}
          className={`flex items-center gap-3 rounded-2xl border p-3 transition-all cursor-pointer ${
            paso === 1
              ? 'border-[#F2620F] bg-[#F2620F]/15 shadow-md shadow-[#F2620F]/10'
              : paso > 1
              ? 'border-[#3FA65C] bg-[#3FA65C]/10'
              : 'border-[rgba(243,239,231,0.08)] bg-[#14181D]'
          }`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl font-['Barlow_Condensed'] text-sm font-bold ${
              paso === 1
                ? 'bg-[#F2620F] text-[#16191E]'
                : paso > 1
                ? 'bg-[#3FA65C] text-[#16191E]'
                : 'bg-white/10 text-[#B8B2A6]'
            }`}
          >
            01
          </div>
          <div>
            <div className="font-['Barlow_Condensed'] text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
              Parámetros de Unidad
            </div>
            <div className="hidden text-[10px] text-[#B8B2A6] sm:block">Odómetro, Chofer y Combustible</div>
          </div>
        </div>

        <div
          onClick={() => setPaso(2)}
          className={`flex items-center gap-3 rounded-2xl border p-3 transition-all cursor-pointer ${
            paso === 2
              ? 'border-[#F2620F] bg-[#F2620F]/15 shadow-md shadow-[#F2620F]/10'
              : paso > 2
              ? 'border-[#3FA65C] bg-[#3FA65C]/10'
              : 'border-[rgba(243,239,231,0.08)] bg-[#14181D]'
          }`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl font-['Barlow_Condensed'] text-sm font-bold ${
              paso === 2
                ? 'bg-[#F2620F] text-[#16191E]'
                : paso > 2
                ? 'bg-[#3FA65C] text-[#16191E]'
                : 'bg-white/10 text-[#B8B2A6]'
            }`}
          >
            02
          </div>
          <div>
            <div className="font-['Barlow_Condensed'] text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
              Checklist de Sistemas
            </div>
            <div className="hidden text-[10px] text-[#B8B2A6] sm:block">14 Componentes Mecánicos</div>
          </div>
        </div>

        <div
          onClick={() => setPaso(3)}
          className={`flex items-center gap-3 rounded-2xl border p-3 transition-all cursor-pointer ${
            paso === 3
              ? 'border-[#F2620F] bg-[#F2620F]/15 shadow-md shadow-[#F2620F]/10'
              : 'border-[rgba(243,239,231,0.08)] bg-[#14181D]'
          }`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl font-['Barlow_Condensed'] text-sm font-bold ${
              paso === 3 ? 'bg-[#F2620F] text-[#16191E]' : 'bg-white/10 text-[#B8B2A6]'
            }`}
          >
            03
          </div>
          <div>
            <div className="font-['Barlow_Condensed'] text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
              Veredicto & Firma
            </div>
            <div className="hidden text-[10px] text-[#B8B2A6] sm:block">Emisión y Alertas de Taller</div>
          </div>
        </div>
      </div>

      {/* Formulario Principal del Wizard */}
      <form onSubmit={handleSubmit(alEnviar)}>
        {/* PASO 1: Precarga y Datos Generales (Optimizado Pantalla iPad Pro 10") */}
        {paso === 1 && (
          <div className="rounded-3xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/90 p-5 sm:p-6 backdrop-blur-md space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[rgba(243,239,231,0.08)] pb-3.5">
              <div>
                <h3 className="font-['Barlow_Condensed'] text-xl sm:text-2xl font-bold uppercase tracking-wide text-white">
                  Paso 1: Parámetros del Tracto y Operador
                </h3>
                <p className="text-xs text-[#B8B2A6] mt-0.5">
                  Verifica la unidad asignada y confirma el odómetro actual antes de proceder a la revisión física.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-[#0f0f10] px-3 py-1.5 border border-[rgba(243,239,231,0.08)]">
                <Truck className="h-4 w-4 text-[#C5A059]" />
                <span className="font-['Barlow_Condensed'] text-sm font-bold text-white">
                  {formValores.unidad_id} · {formValores.tipo_operacion}
                </span>
              </div>
            </div>

            {/* Grid de Campos en iPad Pro */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#B8B2A6]">Folio de Inspección</label>
                <input
                  type="text"
                  readOnly
                  {...register('folio')}
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#0f0f10] py-2.5 px-3.5 font-['Barlow_Condensed'] text-base font-bold text-[#C5A059]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#B8B2A6]">Fecha y Hora</label>
                <input
                  type="text"
                  readOnly
                  {...register('fecha')}
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#0f0f10] py-2.5 px-3.5 font-['Barlow_Condensed'] text-sm font-semibold text-white"
                />
              </div>

              {/* Selector de Unidad con Chips Rápidos Táctiles */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#B8B2A6]">Unidad / Tracto</label>
                <select
                  {...register('unidad_id')}
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 px-3.5 font-['Barlow_Condensed'] text-base font-bold text-white focus:border-[#F2620F] focus:outline-none"
                >
                  <option value="WH-101">WH-101 (Tractor Cruce)</option>
                  <option value="WH-104">WH-104 (Tractor Foráneo)</option>
                  <option value="WH-125">WH-125 (Tractor Local)</option>
                  <option value="CJ-502">CJ-502 (Caja Seca 53ft)</option>
                  <option value="TH-201">TH-201 (Thermo King)</option>
                </select>

                {/* Chips de selección táctil rápida */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {UNIDADES_FRECUENTES.map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setValue('unidad_id', u, { shouldValidate: true })}
                      className={`h-7 px-2.5 rounded-lg font-['Barlow_Condensed'] text-xs font-bold transition-all cursor-pointer ${
                        formValores.unidad_id === u
                          ? 'bg-[#F2620F] text-[#16191E] shadow-sm'
                          : 'bg-[#101317] border border-[rgba(243,239,231,0.1)] text-[#B8B2A6] hover:text-white'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#B8B2A6]">ID del Operador</label>
                <input
                  type="text"
                  readOnly
                  {...register('operador_id')}
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#0f0f10] py-2.5 px-3.5 font-['Barlow_Condensed'] text-sm font-semibold text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#B8B2A6]">Nombre del Operador</label>
                <input
                  type="text"
                  {...register('operador_nombre')}
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 px-3.5 text-xs text-white focus:border-[#F2620F] focus:outline-none"
                />
                {errors.operador_nombre && (
                  <p className="mt-1 text-[11px] text-[#F2620F]">{errors.operador_nombre.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#B8B2A6]">Licencia Federal (SCT)</label>
                <input
                  type="text"
                  {...register('licencia')}
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 px-3.5 font-['Barlow_Condensed'] text-sm font-bold text-white focus:border-[#F2620F] focus:outline-none"
                />
              </div>

              {/* Tipo de Operación: Segmented Control Táctil */}
              <div className="md:col-span-2 lg:col-span-1">
                <label className="mb-1.5 block text-xs font-semibold text-[#B8B2A6]">Tipo de Operación</label>
                <div className="grid grid-cols-4 gap-1 rounded-xl border border-[rgba(243,239,231,0.12)] bg-[#101317] p-1">
                  {TIPOS_OPERACION.map(op => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setValue('tipo_operacion', op, { shouldValidate: true })}
                      className={`h-9 rounded-lg font-['Barlow_Condensed'] text-xs font-bold uppercase transition-all cursor-pointer ${
                        formValores.tipo_operacion === op
                          ? 'bg-[#C5A059] text-[#16191E] shadow-md'
                          : 'text-[#B8B2A6] hover:bg-[#1C1C1C] hover:text-white'
                      }`}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kilometraje con Steppers Rápidos (+100, +500, +1000) */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#B8B2A6]">
                  Kilometraje / Odómetro Actual
                </label>
                <div className="relative">
                  <Gauge className="absolute left-3.5 top-3 h-4 w-4 text-[#F2620F]" />
                  <input
                    type="number"
                    {...register('kilometraje', { valueAsNumber: true })}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 pl-10 pr-3 font-['Barlow_Condensed'] text-base font-bold tabular-nums text-white focus:border-[#F2620F] focus:outline-none"
                  />
                </div>
                {/* Steppers táctiles para ajuste veloz */}
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[10px] text-[#B8B2A6] uppercase font-['Barlow_Condensed'] mr-1">Rápido:</span>
                  {[100, 500, 1000].map(delta => (
                    <button
                      key={delta}
                      type="button"
                      onClick={() => ajustarOdometro(delta)}
                      className="h-7 px-2 rounded-lg bg-[#101317] border border-[rgba(243,239,231,0.1)] text-[#B8B2A6] font-['Barlow_Condensed'] text-xs font-bold hover:text-white hover:border-[#F2620F] transition-all flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="h-3 w-3 text-[#F2620F]" />
                      <span>{delta} km</span>
                    </button>
                  ))}
                </div>
                {errors.kilometraje && (
                  <p className="mt-1 text-[11px] text-[#F2620F]">{errors.kilometraje.message}</p>
                )}
              </div>

              {/* Nivel de Combustible con Segmented Control Táctil */}
              <div className="md:col-span-2 lg:col-span-1">
                <label className="mb-1.5 block text-xs font-semibold text-[#B8B2A6] flex items-center gap-1.5">
                  <Fuel className="h-3.5 w-3.5 text-[#C5A059]" />
                  <span>Nivel de Combustible (Táctil)</span>
                </label>
                <div className="grid grid-cols-5 gap-1 rounded-xl border border-[rgba(243,239,231,0.12)] bg-[#101317] p-1">
                  {NIVELES_COMBUSTIBLE.map(nivel => (
                    <button
                      key={nivel}
                      type="button"
                      onClick={() => setValue('nivel_combustible', nivel, { shouldValidate: true })}
                      className={`h-9 rounded-lg font-['Barlow_Condensed'] text-xs font-bold uppercase transition-all cursor-pointer ${
                        formValores.nivel_combustible === nivel
                          ? nivel === 'Reserva'
                            ? 'bg-[#c53030] text-white shadow-md'
                            : 'bg-[#C5A059] text-[#16191E] shadow-md'
                          : 'text-[#B8B2A6] hover:bg-[#1C1C1C] hover:text-white'
                      }`}
                    >
                      {nivel}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: Cuestionario Dinámico con Pestañas de Sistema y Doble Columna (iPad Pro 10") */}
        {paso === 2 && (
          <div className="rounded-3xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/90 p-4 sm:p-6 backdrop-blur-md space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[rgba(243,239,231,0.08)] pb-3.5">
              <div>
                <h3 className="font-['Barlow_Condensed'] text-xl sm:text-2xl font-bold uppercase tracking-wide text-white">
                  Paso 2: Checklist Físico de Componentes
                </h3>
                <p className="text-xs text-[#B8B2A6] mt-0.5">
                  Recorre el tracto y selecciona el estado de cada componente. En "Regular" o "Crítico", detalla la anomalía.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={marcarTodosComoConformes}
                  className="flex items-center gap-1.5 rounded-xl border border-[#3FA65C]/40 bg-[#3FA65C]/15 px-3.5 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#3FA65C] hover:bg-[#3FA65C] hover:text-[#16191E] transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Marcar Todos Conformes</span>
                </button>
                <span className="rounded-xl bg-[#0f0f10] px-3 py-2 border border-[rgba(243,239,231,0.08)] text-xs text-[#B8B2A6]">
                  Tracto: <strong className="text-white font-['Barlow_Condensed']">{formValores.unidad_id}</strong>
                </span>
              </div>
            </div>

            {/* Barra de Progreso y Conteo en Vivo de Componentes */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-[#0d1013] border border-[rgba(243,239,231,0.08)] p-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-[#C5A059]" />
                <span className="text-xs font-['Barlow_Condensed'] uppercase tracking-wider font-bold text-[#B8B2A6]">
                  Filtrar por Zona de Inspección:
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-['Barlow_Condensed'] font-bold">
                <span className="text-[#3FA65C] flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {conteoBueno} Conformes
                </span>
                <span className="text-[#C5A059] flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> {conteoRegular} Advertencias
                </span>
                <span className="text-[#F2620F] flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5" /> {conteoCritico} Críticos
                </span>
              </div>
            </div>

            {/* Pestañas de Selección de Subsistema / Zonas del Camión */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {SISTEMAS_TABS.map(tab => {
                const countEnSistema = tab === 'Todos' 
                  ? fields.length 
                  : fields.filter(f => f.sistema === tab).length

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSistemaActivo(tab)}
                    className={`h-9 px-3.5 rounded-xl font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      sistemaActivo === tab
                        ? 'bg-[#F2620F] text-[#16191E] shadow-md font-extrabold'
                        : 'bg-[#101317] border border-[rgba(243,239,231,0.1)] text-[#B8B2A6] hover:text-white'
                    }`}
                  >
                    <span>{tab}</span>
                    <span className="ml-1.5 opacity-75 text-[11px]">({countEnSistema})</span>
                  </button>
                )
              })}

              {sistemaActivo !== 'Todos' && (
                <button
                  type="button"
                  onClick={() => marcarSistemaConforme(sistemaActivo)}
                  className="ml-auto h-9 px-3 rounded-xl bg-[#3FA65C]/15 border border-[#3FA65C]/40 text-[#3FA65C] font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider hover:bg-[#3FA65C] hover:text-[#16191E] transition-all cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Aprobar {sistemaActivo}</span>
                </button>
              )}
            </div>

            {/* Matriz de Componentes en DOBLE COLUMNA TÁCTIL para iPad Pro (md:grid-cols-2) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {itemsFiltrados.map((field) => {
                // Encontrar el índice real en fields
                const realIdx = fields.findIndex(f => f.id === field.id)
                const itemActual = formValores.items[realIdx]
                const tieneFalla = itemActual?.estado !== 'Bueno'
                const errorItem = errors.items?.[realIdx]?.observacion
                const tieneFoto = Boolean(itemActual?.foto_url)
                const fallasPredefinidas = TAGS_FALLAS_COMUNES[field.id] || [
                  'Fuga o goteo visible',
                  'Desgaste excesivo',
                  'Roto / Dañado',
                  'No opera correctamente'
                ]

                return (
                  <div
                    key={field.id}
                    className={`rounded-2xl border p-3.5 sm:p-4 transition-all ${
                      itemActual?.estado === 'Crítico'
                        ? 'border-[#F2620F]/60 bg-[#B4430A]/15 shadow-md shadow-[#F2620F]/10'
                        : itemActual?.estado === 'Regular'
                        ? 'border-[#C5A059]/60 bg-[#C5A059]/15 shadow-md shadow-[#C5A059]/10'
                        : 'border-[rgba(243,239,231,0.08)] bg-[#101317]/80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                      <div>
                        <span className="text-[10px] uppercase font-['Barlow_Condensed'] font-semibold tracking-wider text-[#C5A059]">
                          {field.sistema}
                        </span>
                        <h4 className="font-['Barlow_Condensed'] text-base sm:text-lg font-bold text-white">
                          {field.componente}
                        </h4>
                      </div>

                      {/* Segmented Control Táctil de 3 Botones para Pulgares (44px de alto) */}
                      <Controller
                        control={control}
                        name={`items.${realIdx}.estado`}
                        render={({ field: selectField }) => (
                          <div className="grid grid-cols-3 gap-1 rounded-xl border border-[rgba(243,239,231,0.12)] bg-[#0f0f10] p-1 shrink-0 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => selectField.onChange('Bueno')}
                              className={`flex items-center justify-center gap-1 h-10 sm:h-11 px-3 rounded-lg font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                selectField.value === 'Bueno'
                                  ? 'bg-[#3FA65C] text-[#16191E] shadow-md font-extrabold'
                                  : 'text-[#B8B2A6] hover:bg-[#1C1C1C] hover:text-white'
                              }`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Bueno</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => selectField.onChange('Regular')}
                              className={`flex items-center justify-center gap-1 h-10 sm:h-11 px-3 rounded-lg font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                selectField.value === 'Regular'
                                  ? 'bg-[#C5A059] text-[#16191E] shadow-md font-extrabold'
                                  : 'text-[#B8B2A6] hover:bg-[#1C1C1C] hover:text-white'
                              }`}
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span>Regular</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => selectField.onChange('Crítico')}
                              className={`flex items-center justify-center gap-1 h-10 sm:h-11 px-3 rounded-lg font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                selectField.value === 'Crítico'
                                  ? 'bg-[#F2620F] text-[#16191E] shadow-md font-extrabold'
                                  : 'text-[#B8B2A6] hover:bg-[#1C1C1C] hover:text-white'
                              }`}
                            >
                              <ShieldAlert className="h-3.5 w-3.5" />
                              <span>Crítico</span>
                            </button>
                          </div>
                        )}
                      />
                    </div>

                    {/* Detalle de Falla, Tags Rápidos y Evidencia Fotográfica */}
                    {tieneFalla && (
                      <div className="mt-3 pt-3 border-t border-[rgba(243,239,231,0.08)] space-y-2.5 animate-in fade-in duration-200">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#f3f4f6]">
                            Detalle de la Falla u Observación (Obligatorio)
                          </label>
                          <input
                            type="text"
                            placeholder="Describe la anomalía observada..."
                            {...register(`items.${realIdx}.observacion`)}
                            className="w-full rounded-xl border border-[#C5A059]/40 bg-[#14181D] py-2 px-3 text-xs text-white placeholder-[#B8B2A6]/50 focus:border-[#F2620F] focus:outline-none"
                          />
                          {errorItem && (
                            <p className="mt-1 text-[11px] text-[#F2620F] font-medium">
                              {errorItem.message}
                            </p>
                          )}
                        </div>

                        {/* Chips de Selección Rápida de Fallas Frecuentes (Para guantes) */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-[#B8B2A6] uppercase font-['Barlow_Condensed'] mr-1">
                            Atajos:
                          </span>
                          {fallasPredefinidas.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => aplicarFallaRapida(realIdx, tag)}
                              className="h-6 px-2 rounded-md bg-[#1C1C1C] border border-[rgba(243,239,231,0.1)] text-[10px] text-[#B8B2A6] font-medium hover:text-[#C5A059] hover:border-[#C5A059] transition-all cursor-pointer"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>

                        {/* Botones de Evidencia Fotográfica (Cámara Nativa / Muestra) */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[rgba(243,239,231,0.06)]">
                          {tieneFoto ? (
                            <div className="flex items-center gap-2 rounded-xl border border-[#3FA65C]/40 bg-[#3FA65C]/10 p-1.5 pr-3">
                              <img 
                                src={itemActual.foto_url} 
                                alt="Evidencia" 
                                className="h-10 w-10 rounded-lg object-cover border border-white/20" 
                              />
                              <div className="text-[11px] text-[#3FA65C] font-semibold">
                                Fotografía registrada
                              </div>
                              <button
                                type="button"
                                onClick={() => removerFotoEvidencia(realIdx)}
                                className="ml-auto rounded-full p-1 text-[#B8B2A6] hover:bg-white/10 hover:text-white cursor-pointer"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {/* Disparador de Cámara Trasera Real */}
                              <label
                                htmlFor={`camara-input-${realIdx}`}
                                className="flex items-center gap-1.5 rounded-xl border border-[#F2620F]/40 bg-[#F2620F]/10 px-3 py-1.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#F2620F] hover:bg-[#F2620F] hover:text-[#16191E] transition-all cursor-pointer"
                              >
                                <Camera className="h-3.5 w-3.5" />
                                <span>Abrir Cámara</span>
                              </label>
                              <input
                                id={`camara-input-${realIdx}`}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                ref={el => { fileInputRefs.current[realIdx] = el }}
                                onChange={(e) => manejarCapturaFoto(realIdx, e)}
                                className="hidden"
                              />

                              {/* Botón de carga o muestra rápida de respaldo */}
                              <button
                                type="button"
                                onClick={() => adjuntarFotoEvidenciaMuestra(realIdx)}
                                className="flex items-center gap-1 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-2.5 py-1.5 font-['Barlow_Condensed'] text-[11px] font-bold uppercase tracking-wider text-[#B8B2A6] hover:text-white transition-all cursor-pointer"
                              >
                                <Upload className="h-3 w-3" />
                                <span>Cargar Muestra</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* PASO 3: Veredicto de Salud y Lienzo de Firma Digital (Optimizado iPad Pro 10") */}
        {paso === 3 && (
          <div className="rounded-3xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/90 p-5 sm:p-6 backdrop-blur-md space-y-5 shadow-xl">
            <div className="border-b border-[rgba(243,239,231,0.08)] pb-3.5">
              <h3 className="font-['Barlow_Condensed'] text-2xl font-bold uppercase tracking-wide text-white">
                Paso 3: Veredicto de Salud y Firma Digital
              </h3>
              <p className="text-xs text-[#B8B2A6] mt-0.5">
                Revisa el balance de la inspección física y plasma tu firma digital directamente en la pantalla de la tableta.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Columna Izquierda: Veredicto del Algoritmo y Fallas Detectadas */}
              <div className="space-y-3.5">
                {(() => {
                  const items = formValores.items || []
                  const criticos = items.filter(i => i.estado === 'Crítico')
                  const regulares = items.filter(i => i.estado === 'Regular')
                  const aprobados = items.length - criticos.length - regulares.length
                  const requiereOT = criticos.length > 0 || regulares.length > 0

                  return (
                    <div
                      className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                        criticos.length > 0
                          ? 'border-[#F2620F] bg-[#B4430A]/20 shadow-lg shadow-[#F2620F]/15'
                          : regulares.length > 0
                          ? 'border-[#C5A059] bg-[#C5A059]/20 shadow-lg shadow-[#C5A059]/15'
                          : 'border-[#3FA65C] bg-[#3FA65C]/20 shadow-lg shadow-[#3FA65C]/15'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {criticos.length > 0 ? (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F2620F] text-[#16191E]">
                            <ShieldAlert className="h-7 w-7" />
                          </div>
                        ) : regulares.length > 0 ? (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#C5A059] text-[#16191E]">
                            <AlertTriangle className="h-7 w-7" />
                          </div>
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3FA65C] text-[#16191E]">
                            <CheckCircle2 className="h-7 w-7" />
                          </div>
                        )}

                        <div>
                          <div className="font-['Barlow_Condensed'] text-xl font-black uppercase tracking-wider text-white">
                            {criticos.length > 0
                              ? 'Unidad Fuera de Servicio · Requiere OT'
                              : regulares.length > 0
                              ? 'Unidad Operativa con Advertencias'
                              : 'Unidad Aprobada 100% · Liberación Total'}
                          </div>
                          <p className="text-xs text-[#f3f4f6]/90 mt-0.5">
                            {requiereOT
                              ? 'Se generará automáticamente la alerta a la cola de trabajo del Taller Mecánico.'
                              : 'La unidad no presenta anomalías y está lista para despacho de patio.'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 pt-3.5 border-t border-white/10 text-center">
                        <div className="rounded-xl bg-black/30 p-2">
                          <div className="font-['Barlow_Condensed'] text-2xl font-black text-[#F2620F] font-mono">
                            {criticos.length}
                          </div>
                          <div className="text-[10px] uppercase font-['Barlow_Condensed'] text-[#B8B2A6]">
                            Críticos
                          </div>
                        </div>
                        <div className="rounded-xl bg-black/30 p-2">
                          <div className="font-['Barlow_Condensed'] text-2xl font-black text-[#C5A059] font-mono">
                            {regulares.length}
                          </div>
                          <div className="text-[10px] uppercase font-['Barlow_Condensed'] text-[#B8B2A6]">
                            Warnings
                          </div>
                        </div>
                        <div className="rounded-xl bg-black/30 p-2">
                          <div className="font-['Barlow_Condensed'] text-2xl font-black text-[#3FA65C] font-mono">
                            {aprobados}
                          </div>
                          <div className="text-[10px] uppercase font-['Barlow_Condensed'] text-[#B8B2A6]">
                            Conformes
                          </div>
                        </div>
                      </div>

                      {/* Lista de Fallas Identificadas para Auditoría Inmediata */}
                      {requiereOT && (
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                          <div className="text-[11px] font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-white">
                            Anomalías Registradas para el Taller:
                          </div>
                          <div className="max-h-28 overflow-y-auto space-y-1 text-xs">
                            {items.filter(it => it.estado !== 'Bueno').map((it, idx) => (
                              <div key={idx} className="flex items-center justify-between rounded-lg bg-black/20 px-2.5 py-1 text-[11px]">
                                <span className="font-semibold text-white">
                                  {it.componente}
                                </span>
                                <span className={`font-['Barlow_Condensed'] font-bold uppercase px-1.5 py-0.5 rounded ${
                                  it.estado === 'Crítico' ? 'bg-[#F2620F]/30 text-[#F2620F]' : 'bg-[#C5A059]/30 text-[#C5A059]'
                                }`}>
                                  {it.estado}: {it.observacion || 'Sin detalle'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Observaciones Generales de Patio (Opcional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Comentarios adicionales sobre el estado de la unidad..."
                    {...register('observaciones_generales')}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs text-white placeholder-[#B8B2A6]/50 focus:border-[#F2620F] focus:outline-none"
                  />
                </div>
              </div>

              {/* Columna Derecha: Firma Táctil en Pantalla (Touch Signature Pad) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#B8B2A6] flex items-center gap-1.5">
                    <PenTool className="h-3.5 w-3.5 text-[#F2620F]" />
                    <span>Lienzo de Firma Táctil (Dedo o Stylus)</span>
                  </label>
                  {tieneFirmaDigital && (
                    <button
                      type="button"
                      onClick={limpiarFirma}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#F2620F] hover:underline cursor-pointer"
                    >
                      <Eraser className="h-3 w-3" />
                      <span>Limpiar Firma</span>
                    </button>
                  )}
                </div>

                {/* Canvas Táctil Interactivo */}
                <div className="relative rounded-2xl border-2 border-dashed border-[rgba(243,239,231,0.2)] bg-[#0d1013] overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={160}
                    onMouseDown={iniciarTrazo}
                    onMouseMove={dibujarTrazo}
                    onMouseUp={finalizarTrazo}
                    onMouseLeave={finalizarTrazo}
                    onTouchStart={iniciarTrazo}
                    onTouchMove={dibujarTrazo}
                    onTouchEnd={finalizarTrazo}
                    className="w-full h-36 touch-none cursor-crosshair"
                  />
                  {!tieneFirmaDigital && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-[#B8B2A6]/50 text-xs">
                      <PenTool className="h-6 w-6 mb-1 opacity-40" />
                      <span>Traza tu firma con el dedo sobre este recuadro</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 text-[10px] font-mono text-[#B8B2A6]/40 uppercase">
                    TOUCH SIGNATURE VERIFIED
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Nombre del Operador que Valida
                  </label>
                  <input
                    type="text"
                    placeholder="Escribe tu nombre completo como firma digital..."
                    {...register('firma_digital')}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 px-3.5 text-sm text-white focus:border-[#F2620F] focus:outline-none font-bold"
                  />
                  {errors.firma_digital && (
                    <p className="mt-1 text-[11px] text-[#F2620F] font-medium">
                      {errors.firma_digital.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STICKY BOTTOM ACTION DOCK (Ergonomía Tablet iPad Pro - Thumb Zone) */}
        <div className="sticky bottom-0 z-30 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 lg:-mx-8 lg:-mb-8 mt-6 border-t border-[rgba(243,239,231,0.15)] bg-[#101418]/95 px-4 py-3 sm:px-6 backdrop-blur-xl shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="font-['Barlow_Condensed'] text-xs uppercase tracking-wider text-[#B8B2A6] hidden sm:inline">
              Navegación:
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map(num => (
                <div
                  key={num}
                  className={`h-2 rounded-full transition-all ${
                    paso === num
                      ? 'w-7 sm:w-8 bg-[#F2620F]'
                      : paso > num
                      ? 'w-3.5 sm:w-4 bg-[#3FA65C]'
                      : 'w-3.5 sm:w-4 bg-white/20'
                  }`}
                />
              ))}
            </div>
            <span className="font-['Barlow_Condensed'] text-xs font-bold text-white uppercase ml-1">
              Paso {paso} de 3
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {paso > 1 && (
              <button
                type="button"
                onClick={() => setPaso((prev) => (prev - 1) as 1 | 2)}
                className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3.5 sm:px-4 py-2.5 sm:py-3 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-white hover:border-white transition-all cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Anterior</span>
              </button>
            )}

            {paso < 3 ? (
              <button
                type="button"
                onClick={() => setPaso((prev) => (prev + 1) as 2 | 3)}
                className="flex items-center gap-2 rounded-xl bg-[#F2620F] px-5 sm:px-8 py-2.5 sm:py-3 font-['Barlow_Condensed'] text-sm sm:text-base font-bold uppercase tracking-wider text-[#16191E] shadow-xl shadow-[#F2620F]/25 hover:bg-[#D9550C] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>{paso === 1 ? 'Siguiente: Checklist Físico' : 'Siguiente: Veredicto y Firma'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-[#F2620F] px-6 sm:px-8 py-3 sm:py-3.5 font-['Barlow_Condensed'] text-sm sm:text-base font-extrabold uppercase tracking-wider text-[#16191E] shadow-xl shadow-[#F2620F]/30 hover:bg-[#D9550C] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>{isSubmitting ? 'Procesando...' : 'Finalizar y Emitir Folio'}</span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Modal del Documento Adjunto Oficial emitido */}
      <OrdenInspeccionModal
        inspeccion={ordenGenerada}
        abierto={modalAbierto}
        alCerrar={() => {
          setModalAbierto(false)
          reset({
            folio: `INS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
            fecha: new Date().toISOString().replace('T', ' ').substring(0, 19),
            operador_id: usuario?.numeroEmpleado || 'EMP-409',
            operador_nombre: usuario?.nombre || 'Juan Morales',
            licencia: 'LIC-CHIH-98842',
            unidad_id: usuario?.unidadAsignada || 'WH-101',
            tipo_operacion: 'Cruce',
            kilometraje: 429000,
            nivel_combustible: '3/4',
            items: SISTEMAS_INSPECCION_DEFAULT.map(item => ({
              ...item,
              estado: 'Bueno',
              observacion: '',
              foto_url: '',
            })),
            observaciones_generales: '',
            firma_digital: usuario?.nombre || 'Juan Morales',
            requiere_ot: false,
            sincronizado: false,
          })
          setPaso(1)
          navigate('/patio')
        }}
      />
    </div>
  )
}

export default PatioInspeccion
